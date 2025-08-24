import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"

interface LevelProgressProps {
  level: number
  points: number
  pointsToNext: number
  progress: number
}

export function LevelProgress({ level, points, pointsToNext, progress }: LevelProgressProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="font-semibold">Level {level}</span>
        </div>
        <Badge variant="secondary">{points.toLocaleString()} points</Badge>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-3" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Current Level</span>
          <span>
            {pointsToNext.toLocaleString()} points to Level {level + 1}
          </span>
        </div>
      </div>
    </div>
  )
}
