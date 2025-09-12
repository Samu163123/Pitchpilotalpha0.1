import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

// GET /api/chat-session/[sessionId]
// Returns full session including messages so the client can resume
export async function GET(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const res = NextResponse.next()
  const supabase = createSupabaseServerClient({
    get: (name) => req.cookies.get(name)?.value,
    set: (name, value, options) => { try { res.cookies.set(name, value, options as any) } catch {} },
    remove: (name, options) => { try { res.cookies.set(name, "", { ...(options as any), expires: new Date(0) }) } catch {} },
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error("[api/chat-session/[id] GET] Unauthorized", { userError: userError?.message })
    return NextResponse.json({ error: "unauthorized", message: userError?.message || "No user" }, { status: 401 })
  }

  const sessionId = params.sessionId
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("session_id, status, outcome, messages, product, persona, scenario_settings, updated_at, started_at, completed_at")
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .maybeSingle()

    if (error) {
      console.error("[api/chat-session/[id] GET] Query error", {
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
    if (!data) {
      console.debug("[api/chat-session/[id] GET] Not found", { sessionId })
      return NextResponse.json({ error: "not_found" }, { status: 404 })
    }
    console.debug("[api/chat-session/[id] GET] Success", { sessionId, messagesCount: Array.isArray(data?.messages) ? data.messages.length : 0 })
    return NextResponse.json({ session: data })
  } catch (e: any) {
    console.error("[api/chat-session/[id] GET] Exception", { message: e?.message })
    return NextResponse.json({ error: "server_error", message: String(e?.message || e) }, { status: 500 })
  }
}

// PATCH /api/chat-session/[sessionId]
// Update status/outcome/messages for a specific session
export async function PATCH(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const res = NextResponse.next()
  const supabase = createSupabaseServerClient({
    get: (name) => req.cookies.get(name)?.value,
    set: (name, value, options) => { try { res.cookies.set(name, value, options as any) } catch {} },
    remove: (name, options) => { try { res.cookies.set(name, "", { ...(options as any), expires: new Date(0) }) } catch {} },
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error("[api/chat-session/[id] PATCH] Unauthorized", { userError: userError?.message })
    return NextResponse.json({ error: "unauthorized", message: userError?.message || "No user" }, { status: 401 })
  }

  let body: any
  try { body = await req.json() } catch {
    console.error("[api/chat-session/[id] PATCH] Invalid JSON body")
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const nowIso = new Date().toISOString()
  const status = body.status as string | undefined
  const outcome = body.outcome ?? undefined
  const messages = body.messages ?? undefined
  const product = body.product ?? undefined
  const persona = body.persona ?? undefined
  const scenarioSettings = body.scenarioSettings ?? undefined

  const patch: any = { updated_at: nowIso }
  if (status) patch.status = status
  if (typeof outcome !== 'undefined') patch.outcome = outcome
  if (typeof messages !== 'undefined') patch.messages = messages
  if (typeof product !== 'undefined') patch.product = product
  if (typeof persona !== 'undefined') patch.persona = persona
  if (typeof scenarioSettings !== 'undefined') patch.scenario_settings = scenarioSettings
  if (status === 'completed') patch.completed_at = nowIso

  try {
    const { error } = await supabase
      .from("chat_sessions")
      .update(patch)
      .eq("user_id", user.id)
      .eq("session_id", params.sessionId)

    if (error) {
      console.error("[api/chat-session/[id] PATCH] Update error", {
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
    console.debug("[api/chat-session/[id] PATCH] Success", { sessionId: params.sessionId })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("[api/chat-session/[id] PATCH] Exception", { message: e?.message })
    return NextResponse.json({ error: "server_error", message: String(e?.message || e) }, { status: 500 })
  }
}
