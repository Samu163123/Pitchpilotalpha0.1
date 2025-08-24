"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChallengeCard } from "@/components/challenge-card"
import { Trophy, Flame, Target, Clock, Star } from "lucide-react"
import { useProfileStore, useSetupSelectionStore, useBuyerPersonaDraftStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { PERSONAS } from "@/lib/data"

const DAILY_CHALLENGES = [
  {
    id: "skeptical-high-ticket",
    title: "Skeptical High-Ticket Sale",
    description: "Sell a premium product to a skeptical buyer in under 5 minutes",
    difficulty: "hard" as const,
    persona: "skeptical" as const,
    product: {
      id: "premium-crm",
      name: "Enterprise CRM Suite",
      description:
        "Advanced customer relationship management platform with AI analytics, custom workflows, and enterprise-grade security. Starting at $500/month per user.",
    },
    timeLimit: 300, // 5 minutes
    points: 500,
    completed: false,
  },
  {
    id: "budget-conscious-quick",
    title: "Budget Breakthrough",
    description: "Convince a budget-conscious buyer to invest in your solution",
    difficulty: "medium" as const,
    persona: "budget" as const,
    product: {
      id: "marketing-automation",
      name: "Marketing Automation Tool",
      description:
        "Streamline your marketing campaigns with automated email sequences, lead scoring, and detailed analytics. Proven ROI of 300%.",
    },
    timeLimit: 480, // 8 minutes
    points: 300,
    completed: true,
  },
  {
    id: "busy-executive",
    title: "Busy Executive Challenge",
    description: "Capture and maintain attention of a distracted, time-poor executive",
    difficulty: "hard" as const,
    persona: "busy" as const,
    product: {
      id: "productivity-suite",
      name: "Executive Productivity Suite",
      description:
        "AI-powered productivity platform that saves executives 2+ hours daily through intelligent scheduling, automated reporting, and priority management.",
    },
    timeLimit: 180, // 3 minutes
    points: 400,
    completed: false,
  },
]

export default function ChallengesPage() {
  const router = useRouter()
  const { streak, points, level } = useProfileStore()
  const { setSelectedProduct } = useSetupSelectionStore()
  const { setDraft } = useBuyerPersonaDraftStore()

  const completedChallenges = DAILY_CHALLENGES.filter((c) => c.completed).length
  const totalChallenges = DAILY_CHALLENGES.length
  const completionRate = (completedChallenges / totalChallenges) * 100

  const handleStartChallenge = (challenge: (typeof DAILY_CHALLENGES)[0]) => {
    // Prefill product
    setSelectedProduct({ ...challenge.product })
    // Prefill a buyer persona draft from our static PERSONAS map
    const p = PERSONAS[challenge.persona]
    setDraft({
      personaName: p.name,
      background: p.background,
      painPoints: p.pains.join("\n"),
      mindset: p.mindset,
    })
    // Route to review with difficulty/timeLimit and autostart flag
    const params = new URLSearchParams()
    params.set("difficulty", challenge.difficulty)
    params.set("timeLimitSec", String(challenge.timeLimit))
    params.set("autostart", "1")
    router.push(`/train/review?${params.toString()}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Daily Challenges</h1>
        <p className="text-muted-foreground">
          Push your limits with targeted scenarios designed to improve specific skills
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
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
              {completedChallenges}/{totalChallenges}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Challenges Completed</span>
              <span>
                {completedChallenges} of {totalChallenges}
              </span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Challenges */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Available Challenges</h2>

        <div className="grid gap-6">
          {DAILY_CHALLENGES.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} onStart={() => handleStartChallenge(challenge)} />
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <Card className="mt-8 bg-muted/30">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">More Challenges Coming Soon</h3>
          <p className="text-muted-foreground">
            We're working on weekly challenges, team competitions, and industry-specific scenarios.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
