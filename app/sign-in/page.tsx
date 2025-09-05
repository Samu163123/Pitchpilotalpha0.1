"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { useRouter, useSearchParams } from "next/navigation"

export default function SignInPage() {
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()
  const search = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null)
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
    // Surface error from callback if any
    const err = search?.get("error")
    if (err) setStatus(err)
    return () => sub.data.subscription.unsubscribe()
  }, [supabase, router, search])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus(null)
    if (!email || !password) return setStatus("Enter email and password")
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setStatus(error.message)
      else setStatus("Signed in")
    } finally {
      setLoading(false)
    }
  }

  const sendMagic = async () => {
    if (!email) return setStatus("Enter your email")
    setLoading(true)
    setStatus(null)
    try {
      const redirectTarget = search?.get("redirect") || "/train/setup"
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { 
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTarget)}` 
        },
      })
      if (error) setStatus(error.message)
      else setStatus("Check your email for the magic link.")
    } finally {
      setLoading(false)
    }
  }

  const onOAuth = async (provider: "google" | "facebook") => {
    try {
      setOauthLoading(provider)
      setStatus(null)
      const redirectTarget = search?.get("redirect") || "/train/setup"
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTarget)}`,
          queryParams: {
            // Recommended prompt for Google to select account
            prompt: provider === "google" ? "select_account" : undefined,
          },
        },
      })
      if (error) setStatus(error.message)
      // data.url is handled by Supabase (redirect), so nothing else here
    } catch (e: any) {
      setStatus(String(e?.message || e))
    } finally {
      setOauthLoading(null)
    }
  }

  const onResetPassword = async () => {
    if (!email) return setStatus("Enter your email to reset password")
    setLoading(true)
    setStatus(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/profile")}`,
      })
      if (error) setStatus(error.message)
      else setStatus("Password reset email sent.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-6 py-24 max-w-md">
      <h1 className="text-3xl font-bold mb-2">Sign in</h1>
      <p className="text-sm text-muted-foreground mb-8">Use your email/password or request a magic link.</p>
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
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
      </form>
      <div className="my-6 flex items-center justify-between">
        <span className="h-px flex-1 bg-border" />
        <span className="px-3 text-xs text-muted-foreground">or continue with</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button variant="outline" className="w-full" onClick={() => onOAuth("google")} disabled={!!oauthLoading}>
          {oauthLoading === "google" ? "Redirecting..." : "Continue with Google"}
        </Button>
        <Button variant="outline" className="w-full" onClick={() => onOAuth("facebook")} disabled={!!oauthLoading}>
          {oauthLoading === "facebook" ? "Redirecting..." : "Continue with Facebook"}
        </Button>
      </div>
      <div className="my-6 flex items-center justify-between">
        <span className="h-px flex-1 bg-border" />
        <span className="px-3 text-xs text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" className="w-full" onClick={sendMagic} disabled={loading || !!oauthLoading}>
        {loading ? "Sending..." : "Send magic link"}
      </Button>
      <div className="flex justify-between items-center mt-3">
        <div className="text-sm text-muted-foreground">
          <button className="underline" onClick={onResetPassword} disabled={loading || !!oauthLoading}>Forgot password?</button>
        </div>
      </div>
      {status && <div className="mt-3 text-sm text-muted-foreground">{status}</div>}
      <p className="mt-8 text-sm text-muted-foreground">
        Don&apos;t have an account? <Link href="/sign-up" className="underline">Sign up</Link>
      </p>
    </div>
  )
}
