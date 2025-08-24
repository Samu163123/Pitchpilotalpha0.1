import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

interface PointsBadgeProps {
  points: number
}

export function PointsBadge({ points }: PointsBadgeProps) {
  return (
    <Badge variant="outline" className="flex items-center space-x-1 px-3 py-1">
      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
      <span className="font-semibold">{points.toLocaleString()}</span>
      <span className="text-muted-foreground">points</span>
    </Badge>
  )
}
