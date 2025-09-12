import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

// POST /api/chat-session
// Upsert a chat session by (user_id, session_id)
// Body: { sessionId: string, messages: any[], status?: string, outcome?: string|null, product?: any, persona?: any, scenarioSettings?: any }
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient({
    get: (name) => req.cookies.get(name)?.value,
    set: (_name, _value, _options) => {},
    remove: (_name, _options) => {},
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error("[api/chat-session POST] Unauthorized", { userError: userError?.message })
    return NextResponse.json({ error: "unauthorized", message: userError?.message || "No user" }, { status: 401 })
  }

  let body: any
  try { body = await req.json() } catch {
    console.error("[api/chat-session POST] Invalid JSON body")
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const sessionId = String(body.sessionId || body.session_id || "").trim()
  if (!sessionId) {
    console.error("[api/chat-session POST] Missing sessionId in body")
    return NextResponse.json({ error: "missing_sessionId" }, { status: 400 })
  }

  const nowIso = new Date().toISOString()
  const status = String(body.status || "in_progress")
  const outcome = body.outcome ?? null

  const row = {
    user_id: user.id,
    session_id: sessionId,
    status,
    outcome,
    messages: body.messages ?? [],
    product: body.product ?? null,
    persona: body.persona ?? null,
    scenario_settings: body.scenarioSettings ?? null,
    updated_at: nowIso,
    completed_at: status === "completed" ? nowIso : null,
  }

  try {
    console.debug("[api/chat-session POST] Upsert begin", {
      userId: user.id,
      sessionId,
      status,
      outcome: outcome ?? null,
      messagesCount: Array.isArray(row.messages) ? row.messages.length : 0,
    })
    const { error } = await supabase
      .from("chat_sessions")
      .upsert(row, { onConflict: "user_id,session_id" })

    if (error) {
      console.error("[api/chat-session POST] Upsert error", {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
      })
      return NextResponse.json(
        { error: "db_error", message: (error as any)?.message, details: (error as any)?.details, hint: (error as any)?.hint, code: (error as any)?.code },
        { status: 500 }
      )
    }

    console.debug("[api/chat-session POST] Upsert success", { sessionId })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    console.error("[api/chat-session POST] Exception", { message: e?.message })
    return NextResponse.json({ error: "server_error", message: String(e?.message || e) }, { status: 500 })
  }
}

// GET /api/chat-session?status=in_progress|completed (default: all)
export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient({
    get: (name) => req.cookies.get(name)?.value,
    set: (_name, _value, _options) => {},
    remove: (_name, _options) => {},
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error("[api/chat-session GET] Unauthorized", { userError: userError?.message })
    return NextResponse.json({ error: "unauthorized", message: userError?.message || "No user" }, { status: 401 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get("status") || undefined

  try {
    let query = supabase
      .from("chat_sessions")
      .select("session_id, status, outcome, updated_at, started_at, product, persona, scenario_settings")
      .eq("user_id", user.id)
    if (status) query = query.eq("status", status)
    const { data, error } = await query.order("updated_at", { ascending: false }).limit(100)
    if (error) {
      console.error("[api/chat-session GET] Query error", {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
      })
      return NextResponse.json(
        { error: "db_error", message: (error as any)?.message, details: (error as any)?.details, hint: (error as any)?.hint, code: (error as any)?.code },
        { status: 500 }
      )
    }
    console.debug("[api/chat-session GET] Success", { count: data?.length || 0 })
    return NextResponse.json({ sessions: data ?? [] })
  } catch (e: any) {
    console.error("[api/chat-session GET] Exception", { message: e?.message })
    return NextResponse.json({ error: "server_error", message: String(e?.message || e) }, { status: 500 })
  }
}
