"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { useRouter, useSearchParams } from "next/navigation"

export default function SignUpPage() {
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()
  const search = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const redirectTarget = search?.get("redirect") || "/train/setup"
    const handleSession = (session: Session | null) => {
      setUserEmail(session?.user?.email ?? null)
      if (session) {
        router.push(redirectTarget)
      }
    }
    const sub = supabase.auth.onAuthStateChange(async (_e: AuthChangeEvent, session: Session | null) => {
      handleSession(session)
    })
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => handleSession(data.session))
    return () => sub.data.subscription.unsubscribe()
  }, [supabase, router, search])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus(null)
    if (!email || !password) return setStatus("Enter email and password")
    if (password.length < 6) return setStatus("Password must be at least 6 characters")
    setLoading(true)
    try {
      const redirectTarget = search?.get("redirect") || "/train/setup"
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTarget)}` },
      })
      if (error) setStatus(error.message)
      else if (data.user?.identities && data.user.identities.length === 0) setStatus("Account already exists. Try signing in.")
      else setStatus("Check your email to confirm your account.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-6 py-24 max-w-md">
      <h1 className="text-3xl font-bold mb-2">Create account</h1>
      <p className="text-sm text-muted-foreground mb-8">Sign up with email and password. You may need to confirm your email depending on settings.</p>
      {userEmail && (
        <div className="mb-4 text-sm">Signed in as {userEmail}</div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing up..." : "Sign up"}</Button>
      </form>
      {status && <div className="mt-3 text-sm text-muted-foreground">{status}</div>}
      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account? <Link href="/sign-in" className="underline">Sign in</Link>
      </p>
    </div>
  )
}
