"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertCircle, DollarSign, Clock } from "lucide-react"
import type { TranscriptSegment } from "@/lib/types"
import { useMemo } from "react"

interface BuyerNotesPanelProps {
  transcript: TranscriptSegment[]
}

export function BuyerNotesPanel({ transcript }: BuyerNotesPanelProps) {
  const buyerNotes = useMemo(() => {
    const buyerSegments = transcript.filter((s) => s.role === "buyer")
    const notes = []

    // Extract pain points (keywords)
    const painKeywords = ["budget", "cost", "expensive", "time", "busy", "problem", "issue", "concern"]
    const priorities = ["important", "priority", "need", "must", "require", "essential"]
    const objections = ["but", "however", "concern", "worry", "doubt", "skeptical"]

    for (const segment of buyerSegments) {
      const text = segment.text.toLowerCase()

      // Check for pain points
      for (const keyword of painKeywords) {
        if (text.includes(keyword)) {
          notes.push({
            type: "pain",
            text: `Mentioned ${keyword} concerns`,
            timestamp: segment.timestamp,
          })
          break
        }
      }

      // Check for priorities
      for (const keyword of priorities) {
        if (text.includes(keyword)) {
          notes.push({
            type: "priority",
            text: `Indicated ${keyword} as key factor`,
            timestamp: segment.timestamp,
          })
          break
        }
      }

      // Check for objections
      for (const keyword of objections) {
        if (text.includes(keyword)) {
          notes.push({
            type: "objection",
            text: `Raised objection or concern`,
            timestamp: segment.timestamp,
          })
          break
        }
      }
    }

    return notes.slice(-5) // Keep last 5 notes
  }, [transcript])

  const getIcon = (type: string) => {
    switch (type) {
      case "pain":
        return <AlertCircle className="w-3 h-3 text-red-500" />
      case "priority":
        return <DollarSign className="w-3 h-3 text-green-500" />
      case "objection":
        return <Clock className="w-3 h-3 text-yellow-500" />
      default:
        return <FileText className="w-3 h-3 text-blue-500" />
    }
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "pain":
        return "bg-red-50 text-red-700 border-red-200"
      case "priority":
        return "bg-green-50 text-green-700 border-green-200"
      case "objection":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      default:
        return "bg-blue-50 text-blue-700 border-blue-200"
    }
  }

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center space-x-2 mb-4">
        <FileText className="w-4 h-4 text-blue-500" />
        <h4 className="font-semibold text-sm">Buyer Intelligence</h4>
        <Badge variant="outline" className="text-xs">
          {buyerNotes.length}
        </Badge>
      </div>

      {buyerNotes.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No buyer insights yet</p>
          <p className="text-xs mt-1">Keep the conversation going to gather intelligence</p>
        </div>
      ) : (
        <div className="space-y-3">
          {buyerNotes.map((note, index) => (
            <Card key={index} className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex items-start space-x-2">
                  {getIcon(note.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={`text-xs ${getBadgeColor(note.type)}`}>{note.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{note.text}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground text-center pt-4 border-t">AI-powered buyer analysis</div>
    </div>
  )
}
