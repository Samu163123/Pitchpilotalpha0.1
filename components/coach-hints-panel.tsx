"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Loader2, RefreshCw } from "lucide-react"
import { useMemo, useState } from "react"
import { sendHintsWebhook } from "@/lib/webhook"
import type { Scenario, TranscriptSegment } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface CoachHintsPanelProps {
  enabled: boolean
  transcript: TranscriptSegment[]
  scenario: Scenario
  sessionId?: string | null
  onInsertText?: (text: string) => void
}

type SuggestionItem = {
  suggestion: string
  example?: string | null
}

function parseSuggestionsFromText(text?: string): SuggestionItem[] {
  if (!text) return []
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)

  const items: SuggestionItem[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    // Treat a non-quoted line as a suggestion headline
    if (!line.startsWith('"')) {
      let example: string | null = null
      const next = lines[i + 1]
      if (next && next.startsWith('"')) {
        example = next.replace(/^"|"$/g, "")
        i += 1
      }
      items.push({ suggestion: line, example })
    } else {
      // If we encounter a quoted line without a leading suggestion, ignore or attach to last
      const ex = line.replace(/^"|"$/g, "")
      if (items.length > 0 && !items[items.length - 1].example) {
        items[items.length - 1].example = ex
      } else {
        // orphan example, skip
      }
    }
  }
  return items
}

export function CoachHintsPanel({ enabled, transcript, scenario, sessionId, onInsertText }: CoachHintsPanelProps) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<SuggestionItem[] | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const totalWithExamples = useMemo(() => (items ? items.filter(i => i.example).length : 0), [items])

  const handleGetHints = async () => {
    if (!sessionId) {
      console.warn("[Hints] No sessionId; aborting request")
      return
    }
    setLoading(true)
    setItems(null)
    setExpanded({})
    try {
      const res = await sendHintsWebhook(sessionId, transcript, scenario)
      if (res.ok) {
        const text = res.text || (typeof res.json === 'string' ? res.json : undefined)
        const parsed = parseSuggestionsFromText(text)
        if (parsed.length > 0) {
          setItems(parsed)
          setLoading(false)
        } else {
          // No suggestions -> show button again
          setItems(null)
          setLoading(false)
        }
      } else {
        // Upstream not OK -> show button again
        setItems(null)
        setLoading(false)
      }
    } catch (e) {
      console.warn("[Hints] Error while requesting hints:", e)
      // Error -> show button again
      setItems(null)
      setLoading(false)
    }
  }

  const toggleExample = (idx: number) => {
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  if (!enabled) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Coach hints disabled</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          <h4 className="font-semibold text-sm">Coaching Hints</h4>
          {items && (
            <Badge variant="secondary" className="text-xs">{items.length} suggestions{totalWithExamples ? ` • ${totalWithExamples} examples` : ''}</Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={handleGetHints} disabled={loading || !sessionId} title="Refresh suggestions">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {!items && !loading && (
        <Button onClick={handleGetHints} disabled={!sessionId} className="w-full">
          Get hints
        </Button>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span>Fetching hints…</span>
        </div>
      )}

      {items && !loading && (
        <div className="space-y-3">
          {items.map((it, idx) => (
            <Card key={idx} className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">{it.suggestion}</p>
                {(!expanded[idx]) && (
                  <Button size="sm" variant="secondary" onClick={() => toggleExample(idx)} disabled={!it.example}>
                    {it.example ? "Show example sentence" : "No example available"}
                  </Button>
                )}
                {(expanded[idx] && it.example) && (
                  <div className="space-y-2">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">“{it.example}”</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleExample(idx)}>Hide example</Button>
                      {onInsertText && (
                        <Button size="sm" onClick={() => onInsertText(it.example!)}>Import to chat</Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
