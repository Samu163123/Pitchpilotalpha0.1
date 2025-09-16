import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { UserPreferences } from "@/lib/types"

function getClient() {
  const cookieStore = cookies()
  // Map to our CookieStore interface expected by createSupabaseServerClient
  return createSupabaseServerClient({
    get: (name: string) => cookieStore.get(name)?.value,
    set: (name: string, value: string, options?: any) => cookieStore.set({ name, value, ...options }),
    remove: (name: string, options?: any) => cookieStore.delete({ name, ...options } as any),
  })
}

export async function GET() {
  try {
    const supabase = getClient()
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userData.user.id)
      .maybeSingle()

    if (error) {
      console.error("[preferences][GET] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ preferences: data as (UserPreferences & { user_id: string }) | null })
  } catch (e: any) {
    console.error("[preferences][GET] Unexpected error:", e)
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = getClient()
    const body = (await req.json()) as { preferences: UserPreferences }
    const prefs: UserPreferences = body?.preferences || {}

    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = {
      user_id: userData.user.id,
      ...prefs,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .maybeSingle()

    if (error) {
      console.error("[preferences][PUT] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ preferences: data })
  } catch (e: any) {
    console.error("[preferences][PUT] Unexpected error:", e)
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 })
  }
}
