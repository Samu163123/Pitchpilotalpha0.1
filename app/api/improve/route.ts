import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Missing GOOGLE_API_KEY" }, { status: 500 })

    const body = await req.json().catch(() => ({})) as {
      text?: string
      product?: { name?: string; description?: string }
      persona?: { personaName?: string; background?: string; painPoints?: string; mindset?: string }
      callType?: { id?: string; name?: string; description?: string; goal?: string; aiInstructions?: string } | null
      chatlog?: Array<{ role: 'user' | 'assistant'; content: string }>
      notes?: string
    }
    const text = (body.text || "").trim()
    if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 })

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" })

    // Build short recent chat context
    const recent = (Array.isArray(body.chatlog) ? body.chatlog.slice(-10) : [])
      .map(m => `${m.role === 'assistant' ? 'Buyer' : 'Seller'}: ${m.content}`)
      .join('\n')

    const prompt = `You are a sales communication coach. Analyze the following sentence in the context of a sales conversation.
Return STRICT JSON with keys: problems (string[]), suggestions (string[]), rewritten (string).
STYLE GUIDANCE: Provide concise, practical advice inspired by well-known sales coaches (e.g., Alex Hormozi, Jeremy Miner, Simon Squibb). Use buyer-centric language, make the value clear, and ask one incisive question if relevant.
ADAPTATION: If the sentence is already solid, suggest minimal tweaks and keep the rewritten version very close to the original (no unnecessary rephrasing). If it's poor, rewrite with clarity and specificity.
CONSTRAINTS: problems: max 3 items. suggestions: max 3 items. Keep each item under 12 words. rewritten: single sentence, under 200 characters. No extra commentary.

Context (optional):
Product: ${body.product?.name ?? ""} — ${body.product?.description ?? ""}
Persona: ${body.persona?.personaName ?? ""}; Background: ${body.persona?.background ?? ""}; Pains: ${body.persona?.painPoints ?? ""}; Mindset: ${body.persona?.mindset ?? ""}
CallType: ${body.callType?.name ?? ""} — ${body.callType?.description ?? ""}
CallGoal: ${body.callType?.goal ?? ""}
CoachNotes: ${typeof body.notes === 'string' ? body.notes.slice(0, 800) : ''}
RecentChat:\n${recent}

Sentence:
"""
${text}
"""`

    // 15s timeout guard to avoid long-running requests
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    let raw: string
    try {
      const result = await model.generateContent([{ text: prompt }])
      raw = result.response.text()
    } finally {
      clearTimeout(timer)
    }
    const jsonText = raw.replace(/^```(?:json)?/i, "").replace(/```\s*$/i, "").trim()
    let parsed: any
    try { parsed = JSON.parse(jsonText) } catch {
      // fallback: simple heuristics if model returned non-JSON
      parsed = { problems: ["Unable to parse model response."], suggestions: [], rewritten: text }
    }
    const problems = Array.isArray(parsed.problems) ? parsed.problems.map(String) : []
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : []
    const rewritten = typeof parsed.rewritten === "string" ? parsed.rewritten : text

    return NextResponse.json({ result: { problems, suggestions, rewritten } })
  } catch (e: any) {
    console.error("[improve] Unexpected error:", e)
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 })
  }
}
