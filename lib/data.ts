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
    id: "custom-crm-niche",
    name: "Custom CRM for Niche Businesses",
    description: "Simplified CRM tailored to niches like dental clinics, gyms, and salons.",
  },
  {
    id: "automated-marketing-funnels",
    name: "Automated Marketing Funnels",
    description: "Ready-made email/SMS/WhatsApp funnels for small businesses.",
  },
  {
    id: "virtual-event-management",
    name: "Virtual Event Management Services",
    description: "Plan and run webinars, workshops, and online conferences.",
  },
  {
    id: "social-media-management",
    name: "Social Media Management Packages",
    description: "Full-service posting, engagement, and ads management.",
  },
  {
    id: "ecommerce-store-setup",
    name: "E-commerce Store Setup",
    description: "Shopify or WooCommerce store setup for niche products.",
  },
  {
    id: "subscription-box-services",
    name: "Subscription Box Services",
    description: "Curated boxes for audiences like pet toys, fitness snacks, or hobby kits.",
  },
  {
    id: "local-lead-generation",
    name: "Local Lead Generation Services",
    description: "Pre-qualified local leads for small businesses.",
  },
  {
    id: "custom-saas-tools",
    name: "Custom SaaS for Small Operations",
    description: "Simple tools like inventory, booking, or invoicing systems.",
  },
  {
    id: "online-course-creation",
    name: "Online Course Creation & Hosting",
    description: "Create, host, and sell professional courses.",
  },
  {
    id: "b2b-automation-scripts",
    name: "B2B Automation Scripts",
    description: "Automations for tasks like data scraping and outreach.",
  },
]

// Product-specific buyer personas (4 per product)
export const PRODUCT_PERSONAS: Record<string, Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  background: string;
  pains: string[];
  mindset: string;
}>> = {
  // 1. Custom CRM for Niche Businesses
  'custom-crm-niche': [
    {
      id: 'carla-clinic-manager',
      name: 'Clinic Manager Carla',
      description: 'Dental clinic manager needing smoother scheduling.',
      icon: '🦷',
      background: 'Age 38, runs a dental clinic focused on patient experience and operational efficiency.',
      pains: ['Scheduling chaos', 'Missed patient follow-ups'],
      mindset: 'Wants automated reminders and streamlined appointment flow.'
    },
    {
      id: 'greg-gym-owner',
      name: 'Gym Owner Greg',
      description: 'Small fitness studio owner tracking renewals manually.',
      icon: '🏋️‍♂️',
      background: 'Age 30, runs a boutique gym with growing membership base.',
      pains: ['Membership tracking is manual', 'Renewals slip through cracks'],
      mindset: 'Increase retention with automated comms and alerts.'
    },
    {
      id: 'sara-salon-owner',
      name: 'Salon Owner Sara',
      description: 'Salon owner losing repeat clients.',
      icon: '💇‍♀️',
      background: 'Age 42, hair & beauty salon with steady local clientele.',
      pains: ['Losing repeat clients', 'No personalized outreach'],
      mindset: 'Run targeted, personalized campaigns to bring clients back.'
    },
    {
      id: 'ryan-real-estate',
      name: 'Real Estate Agent Ryan',
      description: 'Agent juggling leads from multiple channels.',
      icon: '🏠',
      background: 'Age 35, real estate office with mixed lead sources.',
      pains: ['Leads scattered across systems'],
      mindset: 'Centralize contacts and automate follow-ups.'
    },
  ],

  // 2. Automated Marketing Funnels
  'automated-marketing-funnels': [
    { id: 'emma-ecom', name: 'E-commerce Entrepreneur Emma', description: 'Jewelry shop owner with low email engagement.', icon: '💍', background: 'Age 28, runs an online jewelry store.', pains: ['Low email engagement'], mindset: 'Boost sales with automated campaigns.' },
    { id: 'felix-fitness-coach', name: 'Fitness Coach Felix', description: 'Online coach struggling to nurture leads.', icon: '🏃‍♂️', background: 'Age 33, sells online coaching programs.', pains: ['Manual lead nurturing is time-consuming'], mindset: 'Scale acquisition with automated funnels.' },
    { id: 'sam-saas-founder', name: 'SaaS Founder Sam', description: 'Productivity app founder with manual onboarding.', icon: '🧩', background: 'Age 40, runs a SaaS productivity app.', pains: ['Onboarding too manual'], mindset: 'Automate onboarding with drip campaigns.' },
    { id: 'bella-bakery', name: 'Local Bakery Bella', description: 'Cafe owner wants to retain local customers.', icon: '🥐', background: 'Age 37, small café & local delivery.', pains: ['Poor customer retention'], mindset: 'Run weekly promos via automated messaging.' },
  ],

  // 3. Virtual Event Management Services
  'virtual-event-management': [
    { id: 'amanda-association', name: 'Association Amanda', description: 'Trade association leader needing pro events.', icon: '🏛️', background: 'Age 45, manages a trade association.', pains: ['Low-quality virtual conferences'], mindset: 'Achieve a professional online presence.' },
    { id: 'steve-startup', name: 'Startup Founder Steve', description: 'SaaS founder with low launch attendance.', icon: '🚀', background: 'Age 32, leads a SaaS startup.', pains: ['Poor attendance on launches'], mindset: 'Professional webinar management.' },
    { id: 'helen-hr', name: 'HR Manager Helen', description: 'Struggling with boring training sessions.', icon: '🧑‍💼', background: 'Age 39, HR in mid-size company.', pains: ['Boring, low-turnout trainings'], mindset: 'Interactive online training events.' },
    { id: 'chris-community', name: 'Community Organizer Chris', description: 'NGO events struggle online.', icon: '🤝', background: 'Age 50, local NGO organizer.', pains: ['Fundraising events underperform online'], mindset: 'Smooth, high-quality virtual events.' },
  ],

  // 4. Social Media Management Packages
  'social-media-management': [
    { id: 'bella-boutique', name: 'Boutique Owner Bella', description: 'Clothing boutique owner can’t post consistently.', icon: '👗', background: 'Age 29, runs a boutique store.', pains: ['Inconsistent posting'], mindset: 'Drive foot traffic and online sales.' },
    { id: 'ryan-restaurant', name: 'Restaurant Owner Ryan', description: 'Family restaurant with low engagement.', icon: '🍝', background: 'Age 41, runs a family restaurant.', pains: ['Low social engagement'], mindset: 'Promote specials and attract customers.' },
    { id: 'rachel-real-estate', name: 'Real Estate Agent Rachel', description: 'Agent needs more online leads.', icon: '🏘️', background: 'Age 36, real estate agent.', pains: ['Not enough online leads'], mindset: 'Build brand on Instagram & LinkedIn.' },
    { id: 'fiona-fitness', name: 'Fitness Coach Fiona', description: 'Personal trainer can’t keep daily content.', icon: '🧘‍♀️', background: 'Age 30, personal training business.', pains: ['Cannot maintain content cadence'], mindset: 'Grow following and attract clients.' },
  ],

  // 5. E-commerce Store Setup
  'ecommerce-store-setup': [
    { id: 'alice-artisan', name: 'Local Artisan Alice', description: 'Handmade candles seller offline only.', icon: '🕯️', background: 'Age 34, artisan maker.', pains: ['No online store'], mindset: 'Launch shop quickly.' },
    { id: 'fred-fitness-gear', name: 'Fitness Gear Fred', description: 'Gym apparel brand without ecom experience.', icon: '👟', background: 'Age 29, gym apparel line.', pains: ['No e-commerce experience'], mindset: 'Sell online to wider audience.' },
    { id: 'paul-pet-store', name: 'Pet Store Owner Paul', description: 'Local pet shop with limited reach.', icon: '🐶', background: 'Age 40, neighborhood pet shop.', pains: ['Limited reach'], mindset: 'Enable online orders and delivery.' },
    { id: 'hannah-hobbyist', name: 'Hobbyist Hannah', description: 'DIY kits seller finds platforms complex.', icon: '🧰', background: 'Age 27, DIY kits creator.', pains: ['Platforms too complex'], mindset: 'Simple Shopify/WooCommerce setup.' },
  ],

  // 6. Subscription Box Services
  'subscription-box-services': [
    { id: 'frank-fitness', name: 'Fitness Enthusiast Frank', description: 'Needs recurring revenue from audience.', icon: '📦', background: 'Age 32, fitness content brand.', pains: ['Hard to monetize content'], mindset: 'Monthly fitness product box.' },
    { id: 'paula-pet-lover', name: 'Pet Lover Paula', description: 'Wants repeat pet product customers.', icon: '🐾', background: 'Age 37, pet toys & treats business.', pains: ['Repeat purchases are hard'], mindset: 'Monthly pet owner subscriptions.' },
    { id: 'fiona-food-blogger', name: 'Food Blogger Fiona', description: 'Seeks recurring income.', icon: '🥗', background: 'Age 29, healthy snacks blogger.', pains: ['Low recurring revenue'], mindset: 'Monthly snack boxes.' },
    { id: 'harry-hobbyist', name: 'Hobbyist Harry', description: 'Sells seasonal DIY kits only.', icon: '🧵', background: 'Age 35, DIY & crafting kits.', pains: ['Seasonal revenue spikes'], mindset: 'Recurring monthly boxes.' },
  ],

  // 7. Local Lead Generation Services
  'local-lead-generation': [
    { id: 'larry-landscaping', name: 'Landscaping Larry', description: 'Lawn care business needs more locals.', icon: '🌿', background: 'Age 42, lawn care services.', pains: ['Few local customers'], mindset: 'Get pre-qualified homeowner leads.' },
    { id: 'cindy-contractor', name: 'Contractor Cindy', description: 'Small construction company wastes time.', icon: '🏗️', background: 'Age 38, local contractor.', pains: ['Chasing cold leads'], mindset: 'Receive ready-to-call leads.' },
    { id: 'rachel-real-estate-llg', name: 'Real Estate Agent Rachel', description: 'Struggles to find motivated buyers.', icon: '🏡', background: 'Age 36, real estate.', pains: ['Low buyer quality'], mindset: 'More listings and sales.' },
    { id: 'ian-insurance', name: 'Insurance Broker Ian', description: 'Lead acquisition is costly.', icon: '🛡️', background: 'Age 45, health & life insurance.', pains: ['High acquisition cost'], mindset: 'Quality leads for calls.' },
  ],

  // 8. Custom SaaS for Small Operations
  'custom-saas-tools': [
    { id: 'betty-boutique', name: 'Boutique Owner Betty', description: 'Tracks inventory manually.', icon: '🛍️', background: 'Age 31, clothing boutique.', pains: ['Manual inventory tracking'], mindset: 'Simple inventory tool.' },
    { id: 'frank-fitness-studio', name: 'Fitness Studio Owner Frank', description: 'Books classes manually.', icon: '📅', background: 'Age 33, gym studio.', pains: ['Manual class bookings'], mindset: 'Online scheduling system.' },
    { id: 'fiona-freelancer', name: 'Freelancer Fiona', description: 'Invoices and projects hard to track.', icon: '🎨', background: 'Age 28, graphic designer.', pains: ['Messy invoicing & projects'], mindset: 'Easy invoicing + project tracking.' },
    { id: 'carl-cafe', name: 'Café Owner Carl', description: 'Manages orders and suppliers by hand.', icon: '☕', background: 'Age 40, café owner.', pains: ['Manual orders & suppliers'], mindset: 'Streamlined ops dashboard.' },
  ],

  // 9. Online Course Creation & Hosting
  'online-course-creation': [
    { id: 'fiona-fitness-course', name: 'Fitness Coach Fiona', description: 'Can’t scale 1:1 coaching.', icon: '🏅', background: 'Age 30, personal training.', pains: ['Limited scale 1:1'], mindset: 'Sell pre-recorded classes.' },
    { id: 'liam-language', name: 'Language Teacher Liam', description: 'Has limited student capacity.', icon: '🗣️', background: 'Age 35, online lessons.', pains: ['Limited capacity'], mindset: 'Create scalable language courses.' },
    { id: 'maya-marketing', name: 'Marketing Expert Maya', description: '1:1 consulting caps income.', icon: '📈', background: 'Age 38, marketing consultant.', pains: ['Time-for-money limit'], mindset: 'Build online course revenue.' },
    { id: 'hannah-hobbyist-course', name: 'Hobbyist Hannah', description: 'Local classes limit reach.', icon: '🧶', background: 'Age 27, crafting classes.', pains: ['Small local audience'], mindset: 'Sell globally online.' },
  ],

  // 10. B2B Automation Scripts
  'b2b-automation-scripts': [
    { id: 'alan-agency', name: 'Small Agency Owner Alan', description: 'Manual email outreach is repetitive.', icon: '📣', background: 'Age 33, digital marketing agency.', pains: ['Repetitive outreach'], mindset: 'Automate prospecting.' },
    { id: 'rachel-real-estate-b2b', name: 'Real Estate Agent Rachel', description: 'Sends updates to many clients manually.', icon: '🏚️', background: 'Age 36, real estate.', pains: ['Manual reminders & follow-ups'], mindset: 'Automate reminders & follow-ups.' },
    { id: 'amy-accountant', name: 'Accountant Amy', description: 'Tracks invoices by hand.', icon: '🧮', background: 'Age 42, small accounting firm.', pains: ['Manual invoice tracking'], mindset: 'Scripted tracking + notifications.' },
    { id: 'ethan-ecommerce', name: 'E-commerce Store Owner Ethan', description: 'Needs to sync inventory across channels.', icon: '📦', background: 'Age 29, online store.', pains: ['Stock not in sync'], mindset: 'Automate stock and orders sync.' },
  ],
}

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

export type CallType = {
  id: string
  name: string
  category: "stage" | "style" | "process"
  description: string
  goal: string
  aiInstructions: string
  difficulty: "easy" | "medium" | "hard"
}

export const CALL_TYPES: CallType[] = [
  // Based on Sales Stage
  {
    id: "cold-call",
    name: "Cold Call",
    category: "stage",
    description: "Reaching out to someone who hasn't interacted with you before.",
    goal: "Generate interest and set up a meeting.",
    aiInstructions: "Be skeptical and guarded. Ask 'Who is this?' and 'How did you get my number?' Show minimal initial interest. Require strong value proposition to continue listening.",
    difficulty: "hard"
  },
  {
    id: "warm-call",
    name: "Warm Call",
    category: "stage", 
    description: "Contacting someone who has shown interest (e.g., downloaded a guide, signed up for a trial).",
    goal: "Build on prior engagement and move them down the funnel.",
    aiInstructions: "Show moderate interest since you've engaged before. Ask relevant questions about your previous interaction. Be more receptive but still need convincing.",
    difficulty: "medium"
  },
  {
    id: "follow-up-call",
    name: "Follow-Up Call",
    category: "stage",
    description: "After a meeting, demo, or email exchange.",
    goal: "Address objections, provide more info, or push toward the next step.",
    aiInstructions: "Reference previous conversations. Have specific objections ready based on what was discussed. Show you've been thinking about the solution.",
    difficulty: "medium"
  },
  {
    id: "closing-call",
    name: "Closing Call",
    category: "stage",
    description: "Final discussion before making a deal.",
    goal: "Get commitment, finalize pricing, sign contracts.",
    aiInstructions: "Be ready to buy but have final concerns about price, timing, or implementation. Ask for guarantees and references. Negotiate terms.",
    difficulty: "easy"
  },
  {
    id: "retention-call",
    name: "Retention/Account Management Call",
    category: "stage",
    description: "With existing customers.",
    goal: "Ensure satisfaction, upsell, cross-sell, or renew.",
    aiInstructions: "Act as existing customer. Have specific experiences with current product. Show interest in improvements but be cost-conscious about additions.",
    difficulty: "medium"
  },

  // Based on Style
  {
    id: "discovery-call",
    name: "Discovery Call",
    category: "style",
    description: "Asking questions to understand customer needs, pain points, and goals.",
    goal: "Sets the foundation for tailored pitching.",
    aiInstructions: "Be willing to share problems and challenges when asked good questions. Reward consultative approach. Don't volunteer information easily.",
    difficulty: "medium"
  },
  {
    id: "demo-call",
    name: "Demo Call / Presentation Call",
    category: "style",
    description: "Showcasing the product/service.",
    goal: "Demonstrate value, features, and fit.",
    aiInstructions: "Ask specific questions about features. Challenge whether the product actually solves your problems. Want to see proof and examples.",
    difficulty: "medium"
  },
  {
    id: "consultative-call",
    name: "Consultative Call",
    category: "style",
    description: "Focused on solving the customer's problem, acting more like an advisor than a seller.",
    goal: "Builds trust and credibility.",
    aiInstructions: "Appreciate advisory approach. Share more details when salesperson shows expertise. Be suspicious of pushy sales tactics.",
    difficulty: "easy"
  },
  {
    id: "check-in-call",
    name: "Check-In Call",
    category: "style",
    description: "Casual touchpoint without a hard pitch.",
    goal: "Keep the relationship warm.",
    aiInstructions: "Be friendly and conversational. Appreciate the no-pressure approach. Share updates about your business situation.",
    difficulty: "easy"
  },
  {
    id: "objection-handling-call",
    name: "Objection-Handling Call",
    category: "style",
    description: "Specifically to address hesitations about price, timing, or competition.",
    goal: "Address objections and move forward.",
    aiInstructions: "Have strong, specific objections ready. Don't give up easily. Require compelling responses to change your mind.",
    difficulty: "hard"
  },

  // Based on Sales Process
  {
    id: "prospecting-call",
    name: "Prospecting Call",
    category: "process",
    description: "Identifying and qualifying potential buyers.",
    goal: "Identify and qualify potential buyers.",
    aiInstructions: "Be busy and time-conscious. Need to understand value quickly. Ask 'Why should I care?' and 'What's in it for me?'",
    difficulty: "hard"
  },
  {
    id: "qualification-call",
    name: "Qualification Call", 
    category: "process",
    description: "Confirming whether the lead fits criteria (budget, authority, need, timeline).",
    goal: "Confirm budget, authority, need, and timeline (BANT).",
    aiInstructions: "Be cautious about sharing budget details. Ask why they need this information. Show you have decision-making authority but involve others.",
    difficulty: "medium"
  },
  {
    id: "negotiation-call",
    name: "Negotiation Call",
    category: "process", 
    description: "Discussing pricing, terms, and final details.",
    goal: "Finalize pricing, terms, and details.",
    aiInstructions: "Focus heavily on price and terms. Compare to competitors. Ask for discounts and better terms. Show you're serious but price-sensitive.",
    difficulty: "medium"
  }
]
