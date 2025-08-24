"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, ThumbsUp, Lightbulb } from "lucide-react"

interface Moment {
  timestamp: number
  title: string
  whatWorked: string
  tryInstead: string
}

interface MomentsTimelineProps {
  moments: Moment[]
  onMomentClick?: (timestamp: number) => void
}

export function MomentsTimeline({ moments, onMomentClick }: MomentsTimelineProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (moments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No key moments identified in this call</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {moments.map((moment, index) => (
        <Card key={index} className="relative">
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{index + 1}</span>
                </div>
                {index < moments.length - 1 && <div className="w-0.5 h-16 bg-border mt-2" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold">{moment.title}</h3>
                  <Badge variant="outline" className="text-xs">
                    {formatTime(moment.timestamp)}
                  </Badge>
                  {onMomentClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMomentClick(moment.timestamp)}
                      className="text-xs"
                    >
                      View in transcript
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* What Worked */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-700">What Worked</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{moment.whatWorked}</p>
                  </div>

                  {/* Try Instead */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-700">Try Instead</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">{moment.tryInstead}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
