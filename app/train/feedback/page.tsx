"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScoreRadial } from "@/components/score-radial"
import { CategoryBar } from "@/components/category-bar"
import { MomentsTimeline } from "@/components/moments-timeline"
import { TranscriptModal } from "@/components/transcript-modal"
import { Trophy, TrendingDown, RotateCcw, Plus, Download, Play } from "lucide-react"
import { useHistoryStore, useSetupSelectionStore, useBuyerPersonaDraftStore } from "@/lib/store"
import type { Session } from "@/lib/types"

export default function FeedbackPage() {
  const router = useRouter()
  const { sessions } = useHistoryStore()
  const { setSelectedProduct } = useSetupSelectionStore()
  const { setDraft } = useBuyerPersonaDraftStore()
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    // Get the most recent session
    if (sessions.length > 0) {
      setCurrentSession(sessions[0])
    } else {
      // No session found, redirect to setup
      router.push("/train/setup")
    }
  }, [sessions, router])

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your feedback...</p>
        </div>
      </div>
    )
  }

  const { feedback, scenario, transcript, duration } = currentSession
  const isWin = feedback.outcome === "win"

  const handleDownloadTranscript = () => {
    const transcriptText = transcript
      .map(
        (segment) =>
          `[${new Date(segment.timestamp).toLocaleTimeString()}] ${segment.role.toUpperCase()}: ${segment.text}`,
      )
      .join("\n")

    const blob = new Blob([transcriptText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pitchpilot-transcript-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleTryAgain = () => {
    if (!currentSession) return
    const { scenario } = currentSession
    // Prefill stores
    setSelectedProduct({
      id: scenario.product.id,
      name: scenario.product.name,
      description: scenario.product.description,
    })
    setDraft({
      personaName: String(scenario.persona),
      background: scenario.brief.background,
      painPoints: scenario.brief.pains.join("\n"),
      mindset: scenario.brief.mindset,
    })

    const params = new URLSearchParams()
    params.set("difficulty", String(scenario.difficulty))
    if (typeof scenario.timeLimitSec === "number" && scenario.timeLimitSec > 0) {
      params.set("timeLimitSec", String(scenario.timeLimitSec))
    }
    params.set("autostart", "1")
    router.push(`/train/review?${params.toString()}`)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          {isWin ? (
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-green-500" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          )}
        </div>

        <Badge
          className={`text-lg px-4 py-2 mb-4 ${
            isWin ? "bg-green-500/10 text-green-700 border-green-200" : "bg-red-500/10 text-red-700 border-red-200"
          }`}
        >
          {isWin ? "Deal Closed!" : "Deal Lost"}
        </Badge>

        <h1 className="text-3xl font-bold mb-2">Call Summary</h1>
        <p className="text-muted-foreground">
          {scenario.product.name} • {scenario.persona} buyer • {formatDuration(duration)}
        </p>
      </div>

      {/* Score Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <CardTitle>Overall Score</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ScoreRadial score={feedback.score} size={120} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Performance Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CategoryBar label="Objection Handling" score={feedback.categories.objection} color="blue" />
            <CategoryBar label="Rapport Building" score={feedback.categories.rapport} color="green" />
            <CategoryBar label="Closing Techniques" score={feedback.categories.closing} color="purple" />
            <CategoryBar label="Clarity & Communication" score={feedback.categories.clarity} color="orange" />
          </CardContent>
        </Card>
      </div>

      {/* Key Moments */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Key Moments</CardTitle>
          <p className="text-muted-foreground">Highlights from your conversation with actionable insights</p>
        </CardHeader>
        <CardContent>
          <MomentsTimeline
            moments={feedback.moments}
            onMomentClick={(timestamp) => {
              // TODO: Implement scroll to transcript moment
              setShowTranscript(true)
            }}
          />
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>What to Practice Next</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{feedback.nextSkill}</h3>
              <p className="text-sm text-muted-foreground">Focus on this skill in your next training session</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button onClick={() => setShowTranscript(true)} variant="outline">
          <Play className="w-4 h-4 mr-2" />
          Review Transcript
        </Button>

        <Button onClick={handleDownloadTranscript} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download Transcript
        </Button>

        <Button onClick={handleTryAgain} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>

        <Button onClick={() => router.push("/train/setup")}>
          <Plus className="w-4 h-4 mr-2" />
          New Training
        </Button>
      </div>

      {/* Transcript Modal */}
      <TranscriptModal
        open={showTranscript}
        onOpenChange={setShowTranscript}
        transcript={transcript}
        title="Call Transcript"
      />
    </div>
  )
}
