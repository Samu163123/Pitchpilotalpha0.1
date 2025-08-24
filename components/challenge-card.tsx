"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Trophy, CheckCircle, Target } from "lucide-react"
import type { Persona, Difficulty, Product } from "@/lib/types"
import { PERSONAS } from "@/lib/data"

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  persona: Persona
  product: Product
  timeLimit: number
  points: number
  completed: boolean
}

interface ChallengeCardProps {
  challenge: Challenge
  onStart: () => void
}

export function ChallengeCard({ challenge, onStart }: ChallengeCardProps) {
  const personaData = PERSONAS[challenge.persona]

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-700 border-green-200"
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200"
      case "hard":
        return "bg-red-500/10 text-red-700 border-red-200"
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min${mins !== 1 ? "s" : ""}`
  }

  return (
    <Card
      className={`relative ${challenge.completed ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : ""}`}
    >
      {challenge.completed && (
        <div className="absolute top-4 right-4">
          <CheckCircle className="w-6 h-6 text-green-500" />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">{challenge.title}</CardTitle>
            <p className="text-muted-foreground">{challenge.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className={getDifficultyColor(challenge.difficulty)}>{challenge.difficulty}</Badge>
          <Badge variant="outline">
            {personaData.icon} {personaData.name}
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatTime(challenge.timeLimit)}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Trophy className="w-3 h-3" />
            <span>{challenge.points} pts</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Product: {challenge.product.name}</h4>
            <p className="text-sm text-muted-foreground">{challenge.product.description}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4" />
              <span>Goal: Close the deal within time limit</span>
            </div>

            <Button
              onClick={onStart}
              disabled={challenge.completed}
              variant={challenge.completed ? "outline" : "default"}
            >
              {challenge.completed ? "Completed" : "Start Challenge"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
