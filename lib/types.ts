export type Persona = "friendly" | "skeptical" | "busy" | "budget"
export type Difficulty = "easy" | "medium" | "hard"

// Allow rich personas used by product-specific selections
export interface BuyerPersona {
  id: string
  name: string
  description: string
  icon: string
  background: string
  pains: string[]
  mindset: string
}

export type PersonaSelection = Persona | BuyerPersona

// Allow UI difficulty objects as well as string levels
export interface UIDifficulty {
  id: string
  name: string
  description: string
  level: Difficulty
  multiplier: number
}

export type DifficultyValue = Difficulty | UIDifficulty

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
  id?: string
  name: string
  description: string
}

export interface CallType {
  id: string
  name: string
  category: "stage" | "style" | "process"
  description: string
  goal: string
  aiInstructions: string
  difficulty: "easy" | "medium" | "hard"
}

export interface Scenario {
  product: Product
  persona: PersonaSelection
  difficulty: DifficultyValue
  callType?: CallType
  brief: {
    background: string
    pains: string[]
    mindset: string
  }
  // Optional max duration for the call in seconds (null/omitted = unlimited)
  timeLimitSec?: number | null
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

export type ChallengeType =
  | "objection_handling"
  | "discovery"
  | "demo"
  | "closing"
  | "negotiation"

export interface ChallengeItem {
  id: string
  type: ChallengeType
  title: string
  description: string
  difficulty: Difficulty
  personaHint?: string
  product: Product
  timeLimit?: number | null
  points: number
  callType?: CallType
}

export interface UserPreferences {
  role?: string
  seniority_years?: string
  industry?: string
  offering?: string
  audience_role?: string
  company_size?: string
  training_goal?: string
  start_scenario?: string
  target_objections?: string[]
  tone?: string
  feedback_style?: string
  value_props?: string
  proof_points?: string[]
  constraints?: string[]
  accessibility?: { captions?: boolean; ttsPacing?: string } | null
  consent?: { recordings?: boolean; notes?: boolean; timestamp?: string } | null
}
