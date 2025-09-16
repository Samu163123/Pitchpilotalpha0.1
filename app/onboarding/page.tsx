"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { UserPreferences } from "@/lib/types"

const OBJECTION_OPTIONS = [
  "Too expensive",
  "No budget",
  "Already have a vendor",
  "Not a priority",
  "Security concerns",
  "ROI unclear",
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState<UserPreferences>({
    target_objections: [],
    accessibility: null,
    consent: null,
  })

  // If user has prefs, prefill and maybe skip
  useEffect(() => {
    let mounted = true
    fetch("/api/preferences").then(async (r) => {
      if (!mounted) return
      if (r.ok) {
        const data = await r.json()
        if (data?.preferences) {
          setPrefs({ ...(data.preferences as UserPreferences) })
        }
      }
    })
    return () => { mounted = false }
  }, [])

  const savePrefs = async (next?: Partial<UserPreferences>) => {
    const body = { preferences: { ...prefs, ...(next || {}) } }
    setLoading(true)
    try {
      const res = await fetch("/api/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (res.ok) {
        const json = await res.json()
        setPrefs(json.preferences)
        return true
      }
    } finally {
      setLoading(false)
    }
    return false
  }

  const finish = async () => {
    setSaving(true)
    const ok = await savePrefs()
    if (ok) {
      // Prefetch or trigger generation in background (non-blocking)
      try { await fetch("/api/challenges/generate", { method: "POST" }) } catch {}
      router.push("/profile")
    }
    setSaving(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {saving && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="px-4 py-3 rounded-md bg-background border shadow-sm flex items-center gap-3">
            <svg className="animate-spin text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
            <span className="text-sm">Saving changes…</span>
          </div>
        </div>
      )}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Let’s tailor your training</h1>
        <p className="text-muted-foreground">Takes under a minute. You can change these anytime in Profile.</p>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>About your role and audience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Role</label>
                <Input value={prefs.role || ""} onChange={(e) => setPrefs((p) => ({ ...p, role: e.target.value }))} placeholder="AE, SDR, Founder, PMM..." />
              </div>
              <div>
                <label className="text-sm">Seniority</label>
                <Input value={prefs.seniority_years || ""} onChange={(e) => setPrefs((p) => ({ ...p, seniority_years: e.target.value }))} placeholder="0–1, 2–4, 5–9, 10+" />
              </div>
              <div>
                <label className="text-sm">Industry</label>
                <Input value={prefs.industry || ""} onChange={(e) => setPrefs((p) => ({ ...p, industry: e.target.value }))} placeholder="Tech, Healthcare, Finance..." />
              </div>
              <div>
                <label className="text-sm">Typical audience</label>
                <Input value={prefs.audience_role || ""} onChange={(e) => setPrefs((p) => ({ ...p, audience_role: e.target.value }))} placeholder="CXO, VP/Director, Manager..." />
              </div>
              <div>
                <label className="text-sm">Company size</label>
                <Input value={prefs.company_size || ""} onChange={(e) => setPrefs((p) => ({ ...p, company_size: e.target.value }))} placeholder="1–50, 51–250, 251–1000, 1000+" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>Skip</Button>
              <Button onClick={async () => { const ok = await savePrefs(); if (ok) setStep(2) }} disabled={loading}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>What are you selling and your goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm">What are you pitching?</label>
                <Input value={prefs.offering || ""} onChange={(e) => setPrefs((p) => ({ ...p, offering: e.target.value }))} placeholder="e.g., SaaS tool, SMMA services, course..." />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm">Top value proposition (optional)</label>
                <Textarea value={prefs.value_props || ""} onChange={(e) => setPrefs((p) => ({ ...p, value_props: e.target.value }))} placeholder="In 1–2 sentences, what unique value do you offer?" rows={3} />
              </div>
              <div>
                <label className="text-sm">Primary training goal</label>
                <Input value={prefs.training_goal || ""} onChange={(e) => setPrefs((p) => ({ ...p, training_goal: e.target.value }))} placeholder="90‑sec pitch, Objections, Demo narrative..." />
              </div>
              <div>
                <label className="text-sm">Start scenario</label>
                <Input value={prefs.start_scenario || ""} onChange={(e) => setPrefs((p) => ({ ...p, start_scenario: e.target.value }))} placeholder="Cold open, Intro meeting, Technical demo..." />
              </div>
            </div>
            <div>
              <label className="text-sm mb-2 block">Top objections to practice (select 1–2)</label>
              <div className="grid sm:grid-cols-2 gap-2">
                {OBJECTION_OPTIONS.map((opt) => {
                  const checked = (prefs.target_objections || []).includes(opt)
                  return (
                    <label key={opt} className="flex items-center gap-2 p-2 border rounded-md">
                      <Checkbox checked={checked} onCheckedChange={(v) => {
                        setPrefs((p) => {
                          const curr = new Set(p.target_objections || [])
                          if (v) curr.add(opt); else curr.delete(opt)
                          return { ...p, target_objections: Array.from(curr) }
                        })
                      }} />
                      <span>{opt}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>Skip</Button>
                <Button onClick={async () => { const ok = await savePrefs(); if (ok) setStep(3) }} disabled={loading}>Continue</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Style and consent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Preferred feedback style</label>
                <Input value={prefs.feedback_style || ""} onChange={(e) => setPrefs((p) => ({ ...p, feedback_style: e.target.value }))} placeholder="Concise bullets, Detailed coaching, Strict scoring" />
              </div>
              <div>
                <label className="text-sm">Desired speaking tone</label>
                <Input value={prefs.tone || ""} onChange={(e) => setPrefs((p) => ({ ...p, tone: e.target.value }))} placeholder="Consultative, Energetic, Formal, Casual" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm">Accessibility preferences (optional)</label>
                <Input
                  value={(prefs.accessibility?.ttspacing as any) || ""}
                  onChange={(e) => setPrefs((p) => ({ ...p, accessibility: { ...(p.accessibility || {}), ttsPacing: e.target.value } }))}
                  placeholder="TTS pacing (slow/normal/fast), captions"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm">Consent</label>
                <div className="flex items-center gap-2">
                  <Checkbox checked={!!prefs.consent?.recordings} onCheckedChange={(v) => setPrefs((p) => ({ ...p, consent: { ...(p.consent || {}), recordings: !!v, timestamp: new Date().toISOString() } }))} />
                  <span>Allow storing practice recordings and notes for feedback and improvement</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={finish} disabled={loading || saving}>{saving ? 'Saving…' : 'Finish'}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
