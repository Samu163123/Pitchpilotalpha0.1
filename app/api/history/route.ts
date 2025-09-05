import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createSupabaseServerClient({
    get: (name) => req.cookies.get(name)?.value,
    set: (name, value, options) => {
      try { res.cookies.set(name, value, options as any) } catch {}
    },
    remove: (name, options) => {
      try { res.cookies.set(name, "", { ...(options as any), expires: new Date(0) }) } catch {}
    },
  })
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: res.headers })
  }

  const { data, error } = await supabase
    .from("call_history")
    .select("id, session_id, product_name, persona, difficulty, created_at, status, duration, score, outcome")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500, headers: res.headers })
  }

  return new NextResponse(JSON.stringify({ history: data ?? [] }), { status: 200, headers: res.headers })
}

export async function POST(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createSupabaseServerClient({
    get: (name) => req.cookies.get(name)?.value,
    set: (name, value, options) => {
      try { res.cookies.set(name, value, options as any) } catch {}
    },
    remove: (name, options) => {
      try { res.cookies.set(name, "", { ...(options as any), expires: new Date(0) }) } catch {}
    },
  })
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new NextResponse(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: res.headers })
  }

  const row = {
    user_id: user.id,
    session_id: String(body.sessionId || body.session_id),
    product_name: String(body.product?.name || body.product_name || ""),
    persona: String(body.persona || body.scenarioSettings?.persona || body.persona_name || ""),
    difficulty: String(body.difficulty || body.scenarioSettings?.difficulty || ""),
    status: String(body.status || "started"),
    duration: typeof body.duration === "number" ? body.duration : null,
    score: typeof body.score === "number" ? body.score : null,
    outcome: body.outcome ?? null,
    created_at: body.createdAt ? new Date(body.createdAt).toISOString() : new Date().toISOString(),
  }

  const { data, error } = await supabase.from("call_history").insert(row).select("id").single()

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500, headers: res.headers })
  }

  return new NextResponse(JSON.stringify({ id: data?.id }), { status: 200, headers: res.headers })
}
