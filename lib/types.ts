export type Persona = "friendly" | "skeptical" | "busy" | "budget"
export type Difficulty = "easy" | "medium" | "hard"

export interface PersonaDetails {
  name: string
  description: string
  icon: string
  background: string
  pains: string[]
  mindset: string
}

export interface DifficultyDetails {
  name: string
  description: string
  multiplier: number
}

export interface Product {
  id: string
  name: string
  description: string
}

export interface Scenario {
  product: Product
  persona: Persona
  difficulty: Difficulty
  brief: {
    background: string
    pains: string[]
    mindset: string
  }
}

export interface TranscriptSegment {
  id: string
  role: "user" | "buyer"
  text: string
  timestamp: number
}

export interface Feedback {
  outcome: "win" | "loss"
  score: number
  categories: {
    objection: number
    rapport: number
    closing: number
    clarity: number
  }
  moments: Array<{
    timestamp: number
    title: string
    whatWorked: string
    tryInstead: string
  }>
  nextSkill: string
}

export interface Session {
  id: string
  createdAt: number
  scenario: Scenario
  transcript: TranscriptSegment[]
  feedback: Feedback
  duration: number
}

export interface CallMetrics {
  talkTimeRatio: number
  questionCount: number
  closesCount: number
  interruptionCount: number
}
