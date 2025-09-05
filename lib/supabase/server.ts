import { createServerClient } from "@supabase/ssr"

type CookieStore = {
  get: (name: string) => string | undefined
  set: (name: string, value: string, options?: any) => void
  remove: (name: string, options?: any) => void
}

export function createSupabaseServerClient(cookieStore: CookieStore) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)
        },
        set(name: string, value: string, options?: any) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // ignore during edge/runtime limitations
          }
        },
        remove(name: string, options?: any) {
          try {
            cookieStore.remove(name, options)
          } catch {
            // ignore
          }
        },
      },
    }
  )
}
