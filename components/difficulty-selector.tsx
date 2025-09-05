"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import type { Difficulty } from "@/lib/types"
import { DIFFICULTIES } from "@/lib/data"

interface DifficultySelectorProps {
  selectedDifficulty: Difficulty | null
  onSelect: (difficulty: Difficulty) => void
  difficulties: Difficulty[]
}

export function DifficultySelector({ selectedDifficulty, onSelect, difficulties }: DifficultySelectorProps) {
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
        {difficulties.map((difficulty) => (
          <Card
            key={difficulty.id}
            className={`selection-card cursor-pointer transition-all duration-300 shadow-modern border-white ${
              selectedDifficulty?.id === difficulty.id ? "selected ring-2 ring-emerald-500 scale-[1.01]" : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:scale-[1.02]"
            }`}
            onClick={() => onSelect(difficulty)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-lg">{difficulty.name}</CardTitle>
                  <Badge className={getDifficultyColor(difficulty.level)}>{difficulty.level}</Badge>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {difficulty.description}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{difficulty.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Score Multiplier</span>
                <Badge variant="outline">{difficulty.multiplier}x</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
