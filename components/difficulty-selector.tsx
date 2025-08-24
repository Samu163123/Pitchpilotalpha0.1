"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import type { Difficulty } from "@/lib/types"
import { DIFFICULTIES } from "@/lib/data"

interface DifficultySelectorProps {
  selectedDifficulty: Difficulty | null
  onDifficultySelect: (difficulty: Difficulty) => void
}

export function DifficultySelector({ selectedDifficulty, onDifficultySelect }: DifficultySelectorProps) {
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Choose your challenge level</h2>
        <p className="text-muted-foreground">Select the difficulty that matches your current skill level</p>
      </div>

      <div className="grid gap-4 max-w-2xl mx-auto">
        {Object.entries(DIFFICULTIES).map(([key, difficulty]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedDifficulty === key ? "ring-2 ring-primary border-primary" : ""
            }`}
            onClick={() => onDifficultySelect(key as Difficulty)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-lg">{difficulty.name}</CardTitle>
                  <Badge className={getDifficultyColor(key)}>{key}</Badge>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {key === "easy" &&
                          "Perfect for beginners. The buyer will be cooperative with minimal objections."}
                        {key === "medium" &&
                          "Good for intermediate sellers. Expect realistic objections and mixed responses."}
                        {key === "hard" &&
                          "For experienced sellers. The buyer will be challenging with frequent pushback."}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{difficulty.description}</p>
              <div className="mt-3 flex items-center space-x-2">
                <span className="text-sm font-medium">Score multiplier:</span>
                <Badge variant="outline">{difficulty.multiplier}x</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
