"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TranscriptModal } from "@/components/transcript-modal"
import { ScoreRadial } from "@/components/score-radial"
import { Trophy, TrendingDown, Search, Filter, Calendar, Clock } from "lucide-react"
import { useHistoryStore } from "@/lib/store"
import type { Session } from "@/lib/types"
import { PERSONAS } from "@/lib/data"

export default function HistoryPage() {
  const { sessions, clearAll } = useHistoryStore()
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [personaFilter, setPersonaFilter] = useState<string>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "score">("date")

  const filteredSessions = sessions
    .filter((session) => {
      const matchesSearch = session.scenario.product.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPersona = personaFilter === "all" || session.scenario.persona === personaFilter
      const matchesDifficulty = difficultyFilter === "all" || session.scenario.difficulty === difficultyFilter
      const matchesOutcome = outcomeFilter === "all" || session.feedback.outcome === outcomeFilter

      return matchesSearch && matchesPersona && matchesDifficulty && matchesOutcome
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return b.createdAt - a.createdAt
      } else {
        return b.feedback.score - a.feedback.score
      }
    })

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleViewSession = (session: Session) => {
    setSelectedSession(session)
    setShowTranscript(true)
  }

  const getOutcomeIcon = (outcome: string) => {
    return outcome === "win" ? (
      <Trophy className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    )
  }

  const getOutcomeBadge = (outcome: string) => {
    return outcome === "win" ? (
      <Badge className="bg-green-500/10 text-green-700 border-green-200">Won</Badge>
    ) : (
      <Badge className="bg-red-500/10 text-red-700 border-red-200">Lost</Badge>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Training History</h1>
          <p className="text-muted-foreground">Review your past training sessions and track your progress</p>
        </div>

        {sessions.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("Are you sure you want to clear all training history?")) {
                clearAll()
              }
            }}
          >
            Clear History
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Training History</h3>
            <p className="text-muted-foreground mb-6">Complete your first training session to see your history here</p>
            <Button onClick={() => (window.location.href = "/train/setup")}>Start Training</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by product..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={personaFilter} onValueChange={setPersonaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Personas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Personas</SelectItem>
                    {Object.entries(PERSONAS).map(([key, persona]) => (
                      <SelectItem key={key} value={key}>
                        {persona.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Outcomes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    <SelectItem value="win">Won</SelectItem>
                    <SelectItem value="loss">Lost</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: "date" | "score") => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Sort by Date</SelectItem>
                    <SelectItem value="score">Sort by Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sessions List */}
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Score */}
                      <div className="flex-shrink-0">
                        <ScoreRadial score={session.feedback.score} size={60} strokeWidth={4} />
                      </div>

                      {/* Session Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold truncate">{session.scenario.product.name}</h3>
                          {getOutcomeBadge(session.feedback.outcome)}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(session.createdAt)}</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(session.duration)}</span>
                          </div>

                          <Badge variant="outline" className="text-xs">
                            {PERSONAS[session.scenario.persona].name}
                          </Badge>

                          <Badge variant="outline" className="text-xs capitalize">
                            {session.scenario.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {getOutcomeIcon(session.feedback.outcome)}
                      <Button variant="outline" size="sm" onClick={() => handleViewSession(session)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSessions.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No sessions match your current filters</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Transcript Modal */}
      {selectedSession && (
        <TranscriptModal
          open={showTranscript}
          onOpenChange={setShowTranscript}
          transcript={selectedSession.transcript}
          title={`${selectedSession.scenario.product.name} - ${formatDate(selectedSession.createdAt)}`}
        />
      )}
    </div>
  )
}
