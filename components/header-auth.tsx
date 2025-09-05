"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"

export function HeaderAuth() {
  const supabase = getSupabaseBrowserClient()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange(async (_e: AuthChangeEvent, session: Session | null) => {
      setUserEmail(session?.user?.email ?? null)
    })
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => setUserEmail(data.session?.user?.email ?? null))
    return () => sub.data.subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (userEmail) {
    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm text-muted-foreground">Logged in as {userEmail}</span>
        <Button variant="outline" size="sm" onClick={signOut} disabled={loading}>
          {loading ? "..." : "Sign out"}
        </Button>
      </div>
    )
  }

  return (
    <Link href="/sign-in">
      <Button variant="outline">Log in</Button>
    </Link>
  )
}
