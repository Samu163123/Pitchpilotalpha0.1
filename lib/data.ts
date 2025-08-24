import type { Product, Persona, PersonaDetails, Difficulty, DifficultyDetails } from "./types"

export const PERSONAS: Record<Persona, PersonaDetails> = {
  friendly: {
    name: "Friendly",
    description: "Open and collaborative, but needs clarity on value.",
    icon: "😊",
    background:
      "Sarah is a marketing director who values relationships and collaborative partnerships. She's generally positive but needs to understand clear ROI.",
    pains: ["Limited marketing budget", "Need to show measurable results", "Time constraints for implementation"],
    mindset: "Optimistic but cautious about new investments",
  },
  skeptical: {
    name: "Skeptical",
    description: "Questions claims and needs concrete proof.",
    icon: "🤔",
    background:
      "David is a seasoned procurement manager who has seen many pitches. He questions everything and demands evidence for all claims.",
    pains: ["Been burned by overpromising vendors", "Pressure to reduce costs", "Need bulletproof business case"],
    mindset: "Highly skeptical, needs overwhelming proof of value",
  },
  busy: {
    name: "Busy/Distracted",
    description: "Time-poor, easily interrupted.",
    icon: "⏰",
    background:
      "Jennifer is a busy CEO juggling multiple priorities. She has limited time and gets easily distracted by urgent matters.",
    pains: ["Extremely limited time", "Constant interruptions", "Need quick decisions"],
    mindset: "Impatient, needs immediate value proposition",
  },
  budget: {
    name: "Budget-conscious",
    description: "Cost-sensitive; needs ROI justification.",
    icon: "💰",
    background:
      "Mike is a finance director focused on cost optimization. Every purchase needs strong financial justification.",
    pains: ["Tight budget constraints", "Need to justify every expense", "Pressure to cut costs"],
    mindset: "Extremely cost-conscious, needs clear ROI calculations",
  },
} as const

export const DIFFICULTIES: Record<Difficulty, DifficultyDetails> = {
  easy: {
    name: "Easy",
    description: "Mild objections; cooperative tone.",
    multiplier: 1.0,
  },
  medium: {
    name: "Medium",
    description: "Realistic objections; mixed receptiveness.",
    multiplier: 1.5,
  },
  hard: {
    name: "Hard",
    description: "Frequent pushback; high bar to earn trust.",
    multiplier: 2.0,
  },
} as const

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "eco-bottle",
    name: "Eco-friendly Water Bottle",
    description:
      "Premium stainless steel water bottle with temperature control technology. Keeps drinks cold for 24 hours, hot for 12 hours. Made from 100% recycled materials with a lifetime warranty.",
  },
]

export const BUYER_RESPONSES = {
  friendly: {
    easy: [
      "That sounds interesting. Tell me more about how this would work for our team.",
      "I like what I'm hearing so far. What kind of results have other companies seen?",
      "This could be exactly what we need. What's the next step?",
      "I appreciate you taking the time to explain this. How do we get started?",
    ],
    medium: [
      "I'm intrigued, but I need to understand the ROI better. Can you walk me through some numbers?",
      "This looks promising, but I'll need to discuss it with my team first. What information should I share with them?",
      "I like the concept, but I'm concerned about implementation time. How long does this typically take?",
      "The features sound great, but I need to make sure this fits our budget. What are we looking at cost-wise?",
    ],
    hard: [
      "I've heard similar promises before. What makes your solution different from the three others I'm evaluating?",
      "The price point is higher than I expected. I need you to justify why this is worth the premium.",
      "I'm interested, but my boss will need convincing. What's your strongest business case argument?",
      "This sounds good in theory, but I need to see concrete proof. Do you have case studies from similar companies?",
    ],
  },
  skeptical: {
    easy: [
      "I've heard claims like this before. Can you show me some actual data?",
      "That's a bold statement. What evidence do you have to back that up?",
      "I'm not convinced yet. What guarantees can you offer?",
      "How do I know this isn't just marketing hype?",
    ],
    medium: [
      "I find that hard to believe. Can you provide references from current customers?",
      "Your competitors are saying the same thing. What proof do you have that you're different?",
      "Those numbers seem too good to be true. Can you show me the methodology behind them?",
      "I need more than your word on this. What kind of trial or pilot can you offer?",
    ],
    hard: [
      "I've been burned by vendors making similar promises. Why should I trust you?",
      "Your case studies are from different industries. How do I know this applies to us?",
      "The ROI calculations seem inflated. Can you show me the worst-case scenario?",
      "I need independent verification of these claims. Do you have third-party validation?",
    ],
  },
  busy: {
    easy: [
      "I only have a few minutes. Can you give me the key points?",
      "Sorry, I need to take this call. Can you send me a summary?",
      "This sounds relevant, but I'm swamped. What's the quickest way to evaluate this?",
      "I'm interested but pressed for time. What's the minimum commitment to get started?",
    ],
    medium: [
      "Hold on, I have another meeting starting. Can we schedule a follow-up?",
      "I'm getting pulled into a crisis. Can you email me the key details?",
      "This might work, but I need my team to evaluate it. Who should they contact?",
      "I'm interested but can't focus right now. What's the deadline for a decision?",
    ],
    hard: [
      "I really don't have time for this right now. Unless this is urgent, we should reschedule.",
      "I'm in back-to-back meetings all week. Can this wait until next month?",
      "I can't commit to anything new right now. We're in the middle of a major project.",
      "This sounds like it would require a lot of my time. I just don't have bandwidth.",
    ],
  },
  budget: {
    easy: [
      "The price is higher than I budgeted. Can you work with me on this?",
      "I need to understand the total cost of ownership. What am I missing?",
      "This looks good, but I need to see a clear ROI calculation.",
      "Can you show me how this pays for itself?",
    ],
    medium: [
      "I'm working with a tight budget. What's your best price?",
      "The CFO will want to see detailed financial justification. Can you help with that?",
      "I need to compare this with lower-cost alternatives. What's your value proposition?",
      "The budget cycle doesn't start until next quarter. Can you wait?",
    ],
    hard: [
      "This is way over budget. I can't even consider it at this price point.",
      "I need to cut costs, not add new expenses. How does this help me save money?",
      "The board is focused on cost reduction. This looks like the opposite of what they want.",
      "I'd need to see a 300% ROI to justify this expense. Can you deliver that?",
    ],
  },
}

export const COACH_HINTS = [
  "Try asking an open-ended discovery question to understand their needs better.",
  "Listen for pain points and acknowledge them before presenting your solution.",
  "Use the 'Feel, Felt, Found' technique to handle objections.",
  "Ask for permission before diving into features: 'Would it be helpful if I showed you...'",
  "Summarize what you've heard to show you're listening: 'So what I'm hearing is...'",
  "Try a trial close: 'How does this sound so far?'",
  "Focus on business outcomes, not just features.",
  "Ask about their decision-making process: 'What would need to happen for you to move forward?'",
  "Create urgency with a compelling reason to act now.",
  "Use social proof: mention similar customers who've had success.",
]
