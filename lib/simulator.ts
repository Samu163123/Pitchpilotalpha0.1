import type { Persona, Difficulty, TranscriptSegment, Feedback, CallMetrics } from "./types"
import { BUYER_RESPONSES } from "./data"

export function generateBuyerResponse(
  persona: Persona,
  difficulty: Difficulty,
  transcript: TranscriptSegment[],
): string {
  const responses = BUYER_RESPONSES[persona][difficulty]
  const randomIndex = Math.floor(Math.random() * responses.length)
  return responses[randomIndex]
}

export function evaluateCall(
  transcript: TranscriptSegment[],
  metrics: CallMetrics,
  persona: Persona,
  difficulty: Difficulty,
  duration: number,
): Feedback {
  // TODO: Replace with real AI evaluation
  // This is a simplified evaluation for MVP

  const userSegments = transcript.filter((s) => s.role === "user")
  const difficultyMultiplier = difficulty === "easy" ? 1.2 : difficulty === "medium" ? 1.0 : 0.8

  // Calculate category scores (0-100)
  const objectionScore = Math.min(100, (metrics.questionCount * 15 + Math.random() * 20) * difficultyMultiplier)
  const rapportScore = Math.min(100, (userSegments.length * 8 + Math.random() * 30) * difficultyMultiplier)
  const closingScore = Math.min(100, (metrics.closesCount * 25 + Math.random() * 25) * difficultyMultiplier)
  const clarityScore = Math.min(100, (100 - metrics.interruptionCount * 10 + Math.random() * 20) * difficultyMultiplier)

  const categories = {
    objection: Math.round(objectionScore),
    rapport: Math.round(rapportScore),
    closing: Math.round(closingScore),
    clarity: Math.round(clarityScore),
  }

  // Overall score
  const score = Math.round((categories.objection + categories.rapport + categories.closing + categories.clarity) / 4)

  // Determine outcome
  const winProbability = (score / 100) * difficultyMultiplier
  const outcome = Math.random() < winProbability ? "win" : "loss"

  // Generate key moments
  const moments = generateKeyMoments(transcript, userSegments)

  // Next skill to practice
  const lowestCategory = Object.entries(categories).reduce((a, b) => (a[1] < b[1] ? a : b))[0]
  const nextSkill = getNextSkillSuggestion(lowestCategory)

  return {
    outcome,
    score,
    categories,
    moments,
    nextSkill,
  }
}

function generateKeyMoments(transcript: TranscriptSegment[], userSegments: TranscriptSegment[]) {
  // Select 2-3 longer user messages for key moments
  const longSegments = userSegments
    .filter((s) => s.text.length > 50)
    .sort((a, b) => b.text.length - a.text.length)
    .slice(0, 3)

  return longSegments.map((segment, index) => ({
    timestamp: segment.timestamp,
    title: `Key Moment ${index + 1}`,
    whatWorked: generatePositiveFeedback(segment.text),
    tryInstead: generateImprovementSuggestion(segment.text),
  }))
}

function generatePositiveFeedback(text: string): string {
  const positives = [
    "Good use of open-ended questions to gather information",
    "Nice job acknowledging the customer's concerns",
    "Effective use of specific examples and social proof",
    "Strong attempt to create urgency and next steps",
    "Good listening skills demonstrated by summarizing their needs",
  ]
  return positives[Math.floor(Math.random() * positives.length)]
}

function generateImprovementSuggestion(text: string): string {
  const suggestions = [
    "Try asking more discovery questions before presenting solutions",
    "Focus more on business outcomes rather than features",
    "Use the 'Feel, Felt, Found' technique for objection handling",
    "Ask for permission before diving into details",
    "Summarize their needs to show you're listening",
  ]
  return suggestions[Math.floor(Math.random() * suggestions.length)]
}

function getNextSkillSuggestion(category: string): string {
  const skills = {
    objection: "Objection Handling",
    rapport: "Building Rapport",
    closing: "Closing Techniques",
    clarity: "Clear Communication",
  }
  return skills[category as keyof typeof skills] || "Active Listening"
}

// TODO: Replace with real-time AI integration
export function startRealtimeCall() {
  // Placeholder for OpenAI GPT-4o-mini-realtime integration
  console.log("TODO: Integrate OpenAI realtime API")
}

export function sendUserAudioChunk(audioData: ArrayBuffer) {
  // Placeholder for sending audio to AI
  console.log("TODO: Send audio chunk to AI service")
}

export function onBuyerAudioChunk(callback: (audioData: ArrayBuffer) => void) {
  // Placeholder for receiving AI audio response
  console.log("TODO: Handle incoming AI audio")
}
