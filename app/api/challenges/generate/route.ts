import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { ChallengeItem, ChallengeType, Product, UserPreferences } from "@/lib/types"

const MODEL_NAME = "gemini-2.5-flash"

const CHALLENGE_TYPES: ChallengeType[] = [
  "objection_handling",
  "discovery",
  "demo",
  "closing",
  "negotiation",
]

function systemPrompt(prefs: UserPreferences) {
  return `You are an expert sales coach. Generate realistic sales training challenges tailored to the user's context.
Return STRICT JSON with no commentary.

Fields per challenge:
- id: string (kebab-case slug)
- type: one of ${CHALLENGE_TYPES.join(", ")}
- title: short title
- description: 1-2 sentences describing the scenario
- difficulty: one of easy | medium | hard
- personaHint: short hint about the buyer persona and context
- product: { name: string; description: string }
- timeLimit: number (seconds). If unsure, set to null
- points: integer (100-600 based on difficulty)
- callType: one of [discovery-call, demo-call, objection-handling-call, closing-call, negotiation-call]. Choose the most relevant for the challenge type.

User context:
role=${prefs.role || ""}
seniority=${prefs.seniority_years || ""}
industry=${prefs.industry || ""}
offering=${prefs.offering || ""}
audienceRole=${prefs.audience_role || ""}
companySize=${prefs.company_size || ""}
trainingGoal=${prefs.training_goal || ""}
startScenario=${prefs.start_scenario || ""}
objections=${(prefs.target_objections||[]).join(", ")}
tone=${prefs.tone || ""}
feedbackStyle=${prefs.feedback_style || ""}
valueProps=${prefs.value_props || ""}
proofPoints=${(prefs.proof_points||[]).join(", ")}
constraints=${(prefs.constraints||[]).join(", ")}
`
}

function buildUserPrompt(types: ChallengeType[], product: Product) {
  return JSON.stringify({
    product,
    types,
    countPerType: 3,
    timeLimits: { easy: 180, medium: 300, hard: 480 },
  })
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createSupabaseServerClient({
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, options?: any) => cookieStore.set({ name, value, ...options }),
      remove: (name: string, options?: any) => cookieStore.delete({ name, ...options } as any),
    })

    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: prefsRow, error: prefsErr } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userData.user.id)
      .maybeSingle()

    if (prefsErr) {
      console.error("[challenges/generate] Read prefs error:", prefsErr)
      // still proceed with minimal defaults
    }

    const prefs: UserPreferences = (prefsRow || {}) as any

    const body = await req.json().catch(() => ({})) as {
      types?: ChallengeType[]
      product?: Product
      refresh?: boolean
    }

    const types = (Array.isArray(body.types) && body.types.length ? body.types : CHALLENGE_TYPES)
    const product: Product = body.product || { name: prefs.offering || "Your Product", description: prefs.value_props || "User's offering" }

    // If not refresh, try to return last cached set per type
    if (!body.refresh) {
      const out: Record<string, ChallengeItem[]> = {} as any
      const { data: cached, error } = await supabase
        .from("generated_challenges")
        .select("challenge_type, challenges")
        .eq("user_id", userData.user.id)
        .in("challenge_type", types)
        .order("created_at", { ascending: false })
      if (!error && cached) {
        for (const row of cached) {
          if (!out[row.challenge_type]) out[row.challenge_type] = row.challenges as ChallengeItem[]
        }
        const haveAll = types.every(t => Array.isArray(out[t]) && (out[t] as any[]).length >= 3)
        if (haveAll) return NextResponse.json({ challenges: out })
      }
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Missing GOOGLE_API_KEY" }, { status: 500 })
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    const prompt = systemPrompt(prefs)
    const user = buildUserPrompt(types, product)
    const result = await model.generateContent([
      { text: prompt },
      { text: `Generate a JSON object keyed by challenge type. For each type provide an array of 3 challenges. Use realistic objections aligned to the user's industry and audience.` },
      { text: user },
    ])
    const text = result.response.text()

    const jsonText = text.replace(/^```(?:json)?/i, "").replace(/```\s*$/i, "").trim()
    let parsed: any
    try { parsed = JSON.parse(jsonText) } catch (e) {
      console.error("[challenges/generate] Non-JSON model response:", text)
      return NextResponse.json({ error: "Model returned non-JSON", raw: text }, { status: 502 })
    }

    const out: Record<string, ChallengeItem[]> = {}
    const typeToCallType: Record<ChallengeType, { id: string; name: string }> = {
      objection_handling: { id: "objection-handling-call", name: "Objection-Handling Call" },
      discovery: { id: "discovery-call", name: "Discovery Call" },
      demo: { id: "demo-call", name: "Demo Call" },
      closing: { id: "closing-call", name: "Closing Call" },
      negotiation: { id: "negotiation-call", name: "Negotiation Call" },
    }
    for (const t of types) {
      const arrRaw = Array.isArray(parsed[t]) ? parsed[t] : []
      const arr: ChallengeItem[] = arrRaw.map((c: any) => ({
        id: String(c.id || `${t}-${Math.random().toString(36).slice(2, 7)}`),
        type: t,
        title: String(c.title || "Untitled"),
        description: String(c.description || ""),
        difficulty: (c.difficulty || "medium") as any,
        personaHint: c.personaHint || undefined,
        product: {
          name: c?.product?.name || product.name,
          description: c?.product?.description || product.description,
        },
        timeLimit: null,
        points: Number.isFinite(c?.points) ? c.points : (c?.difficulty === 'hard' ? 500 : c?.difficulty === 'easy' ? 200 : 300),
        callType: c?.callType ? { id: String(c.callType), name: "" } as any : (typeToCallType[t] as any),
      }))
      out[t] = arr
      if (arr.length) {
        await supabase.from("generated_challenges").insert({
          user_id: userData.user.id,
          challenge_type: t,
          challenges: arr,
        })
      }
    }

    return NextResponse.json({ challenges: out })
  } catch (e: any) {
    console.error("[challenges/generate] Unexpected error:", e)
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 })
  }
}
