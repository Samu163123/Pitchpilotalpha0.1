"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TranscriptModal } from "@/components/transcript-modal"
import { ScoreRadial } from "@/components/score-radial"
import { Trophy, TrendingDown, Search, Filter, Calendar, Clock, Loader2 } from "lucide-react"
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
  type ServerSessionRow = {
    session_id: string;
    status: string;
    outcome: string | null;
    updated_at: string;
    started_at: string;
    product?: { name?: string; description?: string } | null;
    persona?: { personaName?: string; name?: string; background?: string } | null;
    scenario_settings?: { callType?: { name?: string } | null } | null;
  };
  const [serverSessions, setServerSessions] = useState<ServerSessionRow[]>([])
  const [serverLoading, setServerLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setServerLoading(true)
        setServerError(null)
        const resp = await fetch('/api/chat-session?status=in_progress', { cache: 'no-store' })
        const resp2 = await fetch('/api/chat-session?status=completed', { cache: 'no-store' })
        const list1 = resp.ok ? (await resp.json()).sessions ?? [] : []
        const list2 = resp2.ok ? (await resp2.json()).sessions ?? [] : []
        const merged = [...list1, ...list2] as Array<any>
        merged.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        setServerSessions(merged.map(s => ({
          session_id: s.session_id,
          status: s.status,
          outcome: s.outcome ?? null,
          updated_at: s.updated_at,
          started_at: s.started_at,
          product: s.product ?? null,
          persona: s.persona ?? null,
          scenario_settings: s.scenario_settings ?? null,
        })))
      } catch (e: any) {
        setServerError(String(e?.message || e))
      } finally {
        setServerLoading(false)
      }
    }
    load()
  }, [])

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

      {sessions.length === 0 && serverSessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-20 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-in fade-in-50">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Training History Yet</h3>
            <p className="text-muted-foreground mb-6">Complete a training session and it will appear here with rich details.</p>
            <Button onClick={() => (window.location.href = "/train/setup")} className="animate-in fade-in-50 slide-in-from-bottom-2">Start Training</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Server Sessions */}
          {serverSessions.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Saved Chat Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {serverLoading && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading sessions…
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="relative overflow-hidden rounded-xl border bg-card p-4 animate-pulse">
                          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-muted via-muted/60 to-muted" />
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2 w-full">
                              <div className="h-3 w-24 bg-muted rounded" />
                              <div className="h-4 w-48 bg-muted rounded" />
                            </div>
                            <div className="h-5 w-16 bg-muted rounded" />
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="h-3 w-40 bg-muted rounded" />
                            <div className="h-3 w-32 bg-muted rounded" />
                          </div>
                          <div className="mt-4 h-8 w-24 bg-muted rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {serverError && <div className="text-sm text-red-600">{serverError}</div>}
                {!serverLoading && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {serverSessions.map((s, idx) => (
                    <div
                      key={s.session_id}
                      className="group relative overflow-hidden rounded-xl border bg-card p-4 transition transform hover:-translate-y-0.5 hover:shadow-lg animate-in fade-in-50"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-primary to-primary/70 opacity-80" />
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Session</div>
                          <div className="font-semibold tracking-wide">
                            {(() => {
                              const callType = s.scenario_settings?.callType?.name || 'Call';
                              const buyer = s.persona?.personaName || s.persona?.name || 'Prospect';
                              const product = (s.product?.name || 'product').toString();
                              const productShort = product.length > 30 ? product.slice(0, 27) + '…' : product;
                              return `${callType} to ${buyer} about ${productShort}`;
                            })()}
                          </div>
                          <div className="text-[10px] text-muted-foreground">ID: {s.session_id.slice(0, 8)}…</div>
                        </div>
                        <Badge variant="outline" className="capitalize border-primary/30 text-primary">
                          {s.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="mt-3 text-sm text-muted-foreground">
                        <div>Updated: {new Date(s.updated_at).toLocaleString()}</div>
                        {s.outcome && <div>Outcome: {s.outcome}</div>}
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        {s.status === 'in_progress' && (
                          <Button variant="secondary" size="sm" className="transition-transform group-hover:scale-[1.02]" onClick={() => {
                            try { localStorage.setItem('chatSessionId', s.session_id) } catch {}
                            window.location.href = '/train/chat'
                          }}>Resume</Button>
                        )}
                        {s.status === 'completed' && (
                          <Button variant="outline" size="sm" className="transition-transform group-hover:scale-[1.02]" onClick={() => {
                            try { localStorage.setItem('chatSessionId', s.session_id) } catch {}
                            window.location.href = '/train/chat'
                          }}>Open</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          )}

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

          {/* Local Sessions List (visual refresh) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session, idx) => (
              <div
                key={session.id}
                className="group relative overflow-hidden rounded-xl border bg-card p-5 transition transform hover:-translate-y-0.5 hover:shadow-lg animate-in fade-in-50"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400/60 via-primary to-emerald-400/60 opacity-80" />
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <ScoreRadial score={session.feedback.score} size={56} strokeWidth={4} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{session.scenario.product.name}</h3>
                      {getOutcomeBadge(session.feedback.outcome)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(session.createdAt)}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDuration(session.duration)}</span>
                      <Badge variant="outline" className="text-xs">{PERSONAS[session.scenario.persona].name}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{session.scenario.difficulty}</Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  {getOutcomeIcon(session.feedback.outcome)}
                  <Button variant="outline" size="sm" className="transition-transform group-hover:scale-[1.02]" onClick={() => handleViewSession(session)}>
                    View Details
                  </Button>
                </div>
              </div>
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
