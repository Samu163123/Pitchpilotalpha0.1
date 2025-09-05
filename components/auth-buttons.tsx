"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"

export function AuthButtons() {
  const supabase = getSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [mode, setMode] = useState<"magic" | "password">("magic")

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      setUserEmail(session?.user?.email ?? null)
    })
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => setUserEmail(data.session?.user?.email ?? null))
    return () => {
      sub.data.subscription.unsubscribe()
    }
  }, [supabase])

  const sendMagicLink = async () => {
    if (!email) {
      setStatus("Enter your email")
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}`,
        },
      })
      if (error) {
        setStatus(error.message)
      } else {
        setStatus("Check your email for the magic link.")
      }
    } finally {
      setLoading(false)
    }
  }

  const signUpWithPassword = async () => {
    if (!email || !password) {
      setStatus("Enter email and password")
      return
    }
    if (password.length < 6) {
      setStatus("Password must be at least 6 characters")
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}` },
      })
      if (error) {
        setStatus(error.message)
      } else if (data.user?.identities && data.user.identities.length === 0) {
        setStatus("Account already exists. Please sign in instead.")
      } else {
        setStatus("Check your email to confirm your account.")
      }
    } finally {
      setLoading(false)
    }
  }

  const signInWithPassword = async () => {
    if (!email || !password) {
      setStatus("Enter email and password")
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setStatus(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (userEmail) {
    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm text-muted-foreground">{userEmail}</span>
        <Button variant="outline" size="sm" onClick={signOut} disabled={loading}>Sign out</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="inline-flex rounded-md border p-1 w-fit">
        <button
          type="button"
          className={`px-2 py-1 text-sm rounded ${mode === "magic" ? "bg-muted" : ""}`}
          onClick={() => setMode("magic")}
        >Magic link</button>
        <button
          type="button"
          className={`px-2 py-1 text-sm rounded ${mode === "password" ? "bg-muted" : ""}`}
          onClick={() => setMode("password")}
        >Email + password</button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 w-52"
        />
        {mode === "password" && (
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-9 w-40"
          />
        )}

        {mode === "magic" ? (
          <Button size="sm" onClick={sendMagicLink} disabled={loading}>
            {loading ? "Sending..." : "Send magic link"}
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="default" onClick={signInWithPassword} disabled={loading}>Sign in</Button>
            <Button size="sm" variant="outline" onClick={signUpWithPassword} disabled={loading}>Sign up</Button>
          </div>
        )}
      </div>

      {status && <span className="text-xs text-muted-foreground sm:ml-2">{status}</span>}
    </div>
  )
}
