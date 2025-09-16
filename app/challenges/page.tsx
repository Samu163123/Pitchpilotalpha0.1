"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChallengeCard } from "@/components/challenge-card"
import { Trophy, Flame, Target, Clock, Star, RefreshCw } from "lucide-react"
import { useProfileStore, useBuyerPersonaDraftStore, useSetupSelectionStore, useScenarioStore } from "@/lib/store"
import type { ChallengeItem, ChallengeType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { CALL_TYPES } from "@/lib/data"

const SECTIONS: Array<{ type: ChallengeType; title: string; desc: string }> = [
  { type: "objection_handling", title: "Objection Handling", desc: "Master responses to common pushbacks" },
  { type: "discovery", title: "Discovery", desc: "Ask better questions and uncover needs" },
  { type: "demo", title: "Demo", desc: "Tell a crisp product story that maps to pains" },
  { type: "closing", title: "Closing", desc: "Advance the deal and secure commitment" },
  { type: "negotiation", title: "Negotiation", desc: "Handle pricing and terms with confidence" },
]

export default function ChallengesPage() {
  const { streak, points, level } = useProfileStore()
  const { setDraft } = useBuyerPersonaDraftStore()
  const { setSelectedProduct } = useSetupSelectionStore()
  const { setScenario } = useScenarioStore()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<"all" | ChallengeType>("all")
  const [byType, setByType] = useState<Record<ChallengeType, ChallengeItem[]>>({
    objection_handling: [],
    discovery: [],
    demo: [],
    closing: [],
    negotiation: [],
  })

  const challengesAll = useMemo(() => Object.values(byType).flat(), [byType])
  const completedChallenges = 0
  const totalChallenges = challengesAll.length
  const completionRate = totalChallenges === 0 ? 0 : (completedChallenges / totalChallenges) * 100

  const fetchChallenges = async (opts?: { refresh?: boolean }) => {
    const body = opts?.refresh ? { refresh: true } : undefined
    const res = await fetch("/api/challenges/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
    if (!res.ok) return
    const json = await res.json()
    const map = json?.challenges || {}
    setByType((prev) => ({ ...prev, ...map }))
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try { await fetchChallenges() } finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try { await fetchChallenges({ refresh: true }) } finally { setRefreshing(false) }
  }

  const handleStartChallenge = (challenge: ChallengeItem) => {
    // Seed product & a minimal persona hint so /train/chat (Gemini) can start immediately
    if (challenge.product) {
      setSelectedProduct({ id: challenge.product.id || "challenge-product", name: challenge.product.name, description: challenge.product.description })
    }
    // Use personaHint as a lightweight persona for the chat page
    const hint = challenge.personaHint || `${challenge.type} scenario`
    setDraft({
      personaName: "Buyer",
      background: hint,
      painPoints: "",
      mindset: "",
    })
    // Seed scenario with call type so the AI behaves accordingly
    const ct = challenge.callType && CALL_TYPES.find(c => c.id === challenge.callType?.id)
    setScenario({
      product: {
        id: challenge.product.id || "challenge-product",
        name: challenge.product.name,
        description: challenge.product.description,
      },
      persona: {
        id: "buyer-generic",
        name: "Buyer",
        description: hint,
        icon: "🧑",
        background: hint,
        pains: hint ? [hint] : [],
        mindset: "",
      },
      difficulty: challenge.difficulty,
      callType: ct || undefined,
      brief: {
        background: hint,
        pains: hint ? [hint] : [],
        mindset: "",
      },
      timeLimitSec: null,
    })
    // Navigate to Gemini chat page (avoids any n8n path)
    window.location.href = "/train/chat?fresh=1"
  }

  const filteredTypes = filter === "all" ? SECTIONS.map(s => s.type) : [filter]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="text-center w-full">
          <h1 className="text-3xl font-bold mb-2">Personalized Challenges</h1>
          <p className="text-muted-foreground">Generated from your onboarding preferences</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">{streak}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold">{points.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">{level}</div>
            <div className="text-sm text-muted-foreground">Level</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold">
              {completedChallenges}/{totalChallenges || 0}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(["all" as const, ...SECTIONS.map(s => s.type)]).map((t) => (
          <Button
            key={t}
            variant={filter === t ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(t as any)}
          >
            {t === "all" ? "ALL" : SECTIONS.find(s => s.type === t)?.title}
          </Button>
        ))}
        <div className="ml-auto">
          <Button onClick={handleRefresh} disabled={refreshing} className="inline-flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? "Refreshing" : "Get New Challenges"}
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Challenges Available</span>
              <span>
                {totalChallenges} total
              </span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center text-muted-foreground py-12 flex items-center justify-center gap-3">
          <svg className="animate-spin text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
          Loading personalized challenges…
        </div>
      ) : (
        <div className="space-y-8">
          {SECTIONS.filter(s => filteredTypes.includes(s.type)).map(({ type, title, desc }) => {
            const items = byType[type] || []
            if (!items.length) return null
            return (
              <div key={type} className="space-y-3">
                <div>
                  <h2 className="text-xl font-semibold">{title}</h2>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <div className="grid gap-6">
                  {items.map((c) => (
                    <ChallengeCard
                      key={c.id}
                      challenge={{
                        id: c.id,
                        title: c.title,
                        description: c.description,
                        difficulty: c.difficulty,
                        personaHint: c.personaHint,
                        product: c.product,
                        timeLimit: c.timeLimit,
                        points: c.points,
                        completed: false,
                      }}
                      onStart={() => handleStartChallenge(c)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Card className="mt-8 bg-muted/30">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">More Challenges Coming Soon</h3>
          <p className="text-muted-foreground">
            Weekly challenges, team competitions, and industry-specific scenarios are on the way.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
