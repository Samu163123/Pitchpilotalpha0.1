import { Progress } from "@/components/ui/progress"

interface CategoryBarProps {
  label: string
  score: number
  color?: "blue" | "green" | "purple" | "orange" | "red"
}

export function CategoryBar({ label, score, color = "blue" }: CategoryBarProps) {
  const getColorClass = (color: string) => {
    switch (color) {
      case "green":
        return "text-green-600"
      case "purple":
        return "text-purple-600"
      case "orange":
        return "text-orange-600"
      case "red":
        return "text-red-600"
      default:
        return "text-blue-600"
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className={`text-sm font-bold ${getColorClass(color)}`}>{score}/100</span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  )
}
