"use client"

import { useEffect, useRef } from "react"
import { TranscriptItem } from "@/components/transcript-item"
import type { TranscriptSegment } from "@/lib/types"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TranscriptListProps {
  transcript: TranscriptSegment[]
  errorBelowTs?: number | null
  errorMessage?: string
  onResend?: () => void
}

export function TranscriptList({ transcript, errorBelowTs, errorMessage, onResend }: TranscriptListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)

  useEffect(() => {
    if (shouldAutoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  const handleScroll = () => {
    if (!scrollRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
    shouldAutoScroll.current = isAtBottom
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-4" onScroll={handleScroll}>
      {transcript.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <p>Your conversation will appear here</p>
            <p className="text-sm mt-1">Start by introducing yourself and your product</p>
          </div>
        </div>
      ) : (
        transcript.map((segment) => (
          <div key={segment.id} className="space-y-2">
            <TranscriptItem segment={segment} />
            {errorBelowTs && errorBelowTs === segment.timestamp && segment.role === "user" && (
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 pl-12">
                <AlertCircle className="w-3 h-3" />
                <span>{errorMessage || "Couldn’t get a response."}</span>
                {onResend && (
                  <Button variant="ghost" size="icon" onClick={onResend} title="Resend" className="h-6 w-6">
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
