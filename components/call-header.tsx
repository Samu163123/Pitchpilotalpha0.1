import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, Circle, Plus } from "lucide-react"
import type { Scenario } from "@/lib/types"
import { PERSONAS, DIFFICULTIES } from "@/lib/data"
import { useEffect, useState } from "react"

interface CallHeaderProps {
  scenario: Scenario
  duration: number
  isActive: boolean
  remainingSec?: number | null
  bonusFlashSec?: number | null
}

export function CallHeader({ scenario, duration, isActive, remainingSec, bonusFlashSec }: CallHeaderProps) {
  const personaData = PERSONAS[scenario.persona] || ({ name: "Custom", icon: "👤" } as any)
  const difficultyData = DIFFICULTIES[scenario.difficulty]

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-700 border-green-200"
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200"
      case "hard":
        return "bg-red-500/10 text-red-700 border-red-200"
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200"
    }
  }

  const [showBonus, setShowBonus] = useState<number | null>(null)
  useEffect(() => {
    if (bonusFlashSec && bonusFlashSec > 0) {
      setShowBonus(bonusFlashSec)
      const t = setTimeout(() => setShowBonus(null), 1500)
      return () => clearTimeout(t)
    }
  }, [bonusFlashSec])

  return (
    <Card className="m-4 mb-0">
      <CardContent className="p-4">
        <div className="flex items-center justify-between relative">
          <div className="flex items-center space-x-4">
            {/* Buyer Avatar */}
            <Avatar className="w-12 h-12">
              <AvatarFallback className="text-lg">{personaData.icon}</AvatarFallback>
            </Avatar>

            {/* Buyer Info */}
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold">
                  {personaData.name === "Friendly"
                    ? "Sarah Chen"
                    : personaData.name === "Skeptical"
                      ? "David Miller"
                      : personaData.name === "Busy/Distracted"
                        ? "Jennifer Park"
                        : "Mike Rodriguez"}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {personaData.name}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getDifficultyColor(scenario.difficulty)}>{difficultyData.name}</Badge>
                <span className="text-sm text-muted-foreground">{scenario.product.name}</span>
              </div>
            </div>
          </div>

          {/* Call Status + Timers */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Circle
                className={`w-3 h-3 ${isActive ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"}`}
              />
              <span className="text-sm font-medium">{isActive ? "Call in Progress" : "Call Ended"}</span>
            </div>

            {/* Elapsed */}
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{formatDuration(duration)}</span>
            </div>

            {/* Remaining (if limited) */}
            {typeof remainingSec === "number" && remainingSec >= 0 && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Remaining</span>
                <span className="text-sm font-mono">{formatDuration(remainingSec)}</span>
              </div>
            )}
          </div>

          {/* Bonus flash */}
          {showBonus && (
            <div className="absolute right-0 -top-2 flex items-center gap-1 text-green-600 animate-[fadeIn_150ms_ease-out,fadeOut_300ms_ease-in_1200ms_forwards]">
              <Plus className="w-4 h-4" />
              <span className="font-semibold">{showBonus}s</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
