"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { UserPreferences } from "@/lib/types"
import { useRouter } from "next/navigation"

const OBJECTION_OPTIONS = [
  "Too expensive",
  "No budget",
  "Already have a vendor",
  "Not a priority",
  "Security concerns",
  "ROI unclear",
]

export default function ProfilePage() {
  const router = useRouter()
  const [prefs, setPrefs] = useState<UserPreferences>({ target_objections: [], accessibility: null, consent: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    fetch("/api/preferences").then(async (r) => {
      if (!mounted) return
      setLoading(false)
      if (r.ok) {
        const data = await r.json()
        if (data?.preferences) setPrefs(data.preferences as UserPreferences)
      }
    })
    return () => { mounted = false }
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferences: prefs }) })
      if (res.ok) {
        // no-op
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Update your training preferences anytime.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/onboarding")}>Run Onboarding</Button>
          <Button onClick={async () => { await fetch("/api/challenges/generate", { method: "POST", body: JSON.stringify({ refresh: true }) }); router.push("/challenges") }}>Regenerate Challenges</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Role & Audience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm">Role</label>
              <Input value={prefs.role || ""} onChange={(e) => setPrefs((p) => ({ ...p, role: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm">Seniority</label>
              <Input value={prefs.seniority_years || ""} onChange={(e) => setPrefs((p) => ({ ...p, seniority_years: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm">Industry</label>
              <Input value={prefs.industry || ""} onChange={(e) => setPrefs((p) => ({ ...p, industry: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm">Typical audience</label>
              <Input value={prefs.audience_role || ""} onChange={(e) => setPrefs((p) => ({ ...p, audience_role: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm">Company size</label>
              <Input value={prefs.company_size || ""} onChange={(e) => setPrefs((p) => ({ ...p, company_size: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offering & Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm">What are you pitching?</label>
              <Input value={prefs.offering || ""} onChange={(e) => setPrefs((p) => ({ ...p, offering: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm">Top value prop</label>
              <Textarea rows={3} value={prefs.value_props || ""} onChange={(e) => setPrefs((p) => ({ ...p, value_props: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm">Primary goal</label>
              <Input value={prefs.training_goal || ""} onChange={(e) => setPrefs((p) => ({ ...p, training_goal: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm">Start scenario</label>
              <Input value={prefs.start_scenario || ""} onChange={(e) => setPrefs((p) => ({ ...p, start_scenario: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm">Top objections</label>
              <div className="grid sm:grid-cols-2 gap-2 mt-1">
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
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Style, Accessibility & Consent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Feedback style</label>
                <Input value={prefs.feedback_style || ""} onChange={(e) => setPrefs((p) => ({ ...p, feedback_style: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Tone</label>
                <Input value={prefs.tone || ""} onChange={(e) => setPrefs((p) => ({ ...p, tone: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm">Accessibility (TTS pacing, captions)</label>
                <Input value={(prefs.accessibility?.ttsPacing as any) || ""} onChange={(e) => setPrefs((p) => ({ ...p, accessibility: { ...(p.accessibility || {}), ttsPacing: e.target.value } }))} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm">Consent</label>
                <div className="flex items-center gap-2">
                  <Checkbox checked={!!prefs.consent?.recordings} onCheckedChange={(v) => setPrefs((p) => ({ ...p, consent: { ...(p.consent || {}), recordings: !!v, timestamp: new Date().toISOString() } }))} />
                  <span>Allow storing practice recordings and notes</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
