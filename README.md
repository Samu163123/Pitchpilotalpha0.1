# PitchPilot - AI-Powered Sales Training Platform

**Tagline:** Practice sales. Anywhere. Anytime.

PitchPilot is a comprehensive voice-based sales roleplay trainer that helps sales professionals improve their skills through AI-powered conversations and detailed feedback analysis.

## 🚀 What's Included

### Core Features
- **Multi-step Training Setup**: Choose products, buyer personas, and difficulty levels
- **Live Call Simulation**: Practice with AI buyers in realistic scenarios
- **Detailed Feedback**: Get scored on objection handling, rapport building, closing techniques, and clarity
- **Training History**: Track progress and review past sessions
- **Daily Challenges**: Targeted scenarios to improve specific skills
- **Profile Management**: Customize settings and track achievements

### Technical Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand with localStorage persistence
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Theme**: Light/Dark mode support

### UI/UX Features
- **Mobile-first responsive design**
- **Accessible** (ARIA labels, keyboard navigation, screen reader support)
- **Modern app-like interface**
- **Real-time transcript display**
- **Audio controls simulation**
- **Progress tracking and gamification**

## 🏃‍♂️ How to Run

1. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Start development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Open your browser**:
   Navigate to `http://localhost:3000`

## 🔌 Where to Plug in Realtime/AI

The app is designed with clear integration points for real-time AI services:

### 1. Real-time Voice Integration
**File**: `lib/simulator.ts`

\`\`\`typescript
// TODO: Replace with OpenAI GPT-4o-mini-realtime integration
export function startRealtimeCall() {
  // Integrate OpenAI realtime API via WebRTC
  console.log('TODO: Integrate OpenAI realtime API')
}

export function sendUserAudioChunk(audioData: ArrayBuffer) {
  // Send audio chunk to AI service
  console.log('TODO: Send audio chunk to AI service')
}

export function onBuyerAudioChunk(callback: (audioData: ArrayBuffer) => void) {
  // Handle incoming AI audio response
  console.log('TODO: Handle incoming AI audio')
}
\`\`\`

### 2. Speech-to-Text Integration
**File**: `components/call-controls.tsx`

\`\`\`typescript
const handleMicToggle = () => {
  setIsRecording(!isRecording)
  // TODO: Integrate with real audio recording
  console.log('TODO: Toggle microphone recording')
}
\`\`\`

### 3. AI Evaluation System
**File**: `lib/simulator.ts`

\`\`\`typescript
export function evaluateCall(
  transcript: TranscriptSegment[],
  metrics: CallMetrics,
  persona: Persona,
  difficulty: Difficulty,
  duration: number
): Feedback {
  // TODO: Replace with real AI evaluation
  // This is a simplified evaluation for MVP
}
\`\`\`

### 4. Backend Integration
**Current**: All data stored in localStorage via Zustand
**TODO**: Replace with API calls to your backend

\`\`\`typescript
// Replace localStorage persistence with API calls
// Files to update: lib/store.ts
\`\`\`

## 🔮 Future Work Checklist

### Phase 1: Real-time AI Integration
- [ ] Integrate OpenAI GPT-4o-mini-realtime API
- [ ] Implement WebRTC for real-time audio
- [ ] Add speech-to-text service (OpenAI Whisper)
- [ ] Add text-to-speech for AI responses
- [ ] Replace mock buyer responses with AI-generated content

### Phase 2: Backend & Authentication
- [ ] Set up backend API (Node.js/Python)
- [ ] Implement user authentication
- [ ] Replace localStorage with database storage
- [ ] Add user accounts and profiles
- [ ] Implement session management

### Phase 3: Advanced Features
- [ ] Advanced AI evaluation with detailed insights
- [ ] Custom buyer persona creation
- [ ] Industry-specific scenarios
- [ ] Team/corporate features
- [ ] Leaderboards and competitions
- [ ] Advanced analytics and reporting

### Phase 4: Mobile & Performance
- [ ] Progressive Web App (PWA) support
- [ ] Mobile app development
- [ ] Performance optimizations
- [ ] Offline mode support
- [ ] Push notifications

### Phase 5: Enterprise Features
- [ ] Multi-tenant architecture
- [ ] Admin dashboard
- [ ] Custom branding
- [ ] Integration with CRM systems
- [ ] Advanced reporting and analytics

## 📁 Project Structure

\`\`\`
src/
├── app/                    # Next.js App Router pages
│   ├── challenges/         # Daily challenges page
│   ├── history/           # Training history page
│   ├── profile/           # User profile and settings
│   ├── train/
│   │   ├── call/          # Live call simulation
│   │   ├── feedback/      # Post-call feedback
│   │   └── setup/         # Training setup wizard
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── app-header.tsx    # Main navigation
│   ├── call-*.tsx        # Call-related components
│   ├── wizard-*.tsx      # Setup wizard components
│   └── ...
├── lib/
│   ├── data.ts           # Static data and configurations
│   ├── simulator.ts      # AI simulation logic
│   ├── store.ts          # Zustand state management
│   └── types.ts          # TypeScript type definitions
└── hooks/                # Custom React hooks
\`\`\`

## 🎯 Key Components

### State Management (Zustand)
- **ScenarioStore**: Manages training scenario setup
- **CallStore**: Handles active call state and transcript
- **HistoryStore**: Stores completed training sessions
- **ProfileStore**: User progress and preferences

### Core Pages
- **Landing**: Marketing page with features overview
- **Setup Wizard**: 4-step training configuration
- **Call Screen**: Live simulation with transcript and controls
- **Feedback**: Detailed performance analysis
- **History**: Past sessions with filtering and search
- **Challenges**: Daily targeted training scenarios
- **Profile**: Progress tracking and settings

### Simulation System
- **Buyer Personas**: 4 distinct personality types
- **Difficulty Levels**: Easy, Medium, Hard with score multipliers
- **Response Generation**: Context-aware buyer responses
- **Evaluation Engine**: Multi-category performance scoring

## 🔧 Configuration

### Environment Variables
Currently none required for MVP. Future integrations will need:
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- etc.

### Customization
- **Branding**: Update colors in `tailwind.config.ts`
- **Copy**: Modify text in `lib/data.ts`
- **Personas**: Add new buyer types in `lib/data.ts`
- **Products**: Extend default products list

## 🐛 Common Pitfalls to Avoid

1. **State Persistence**: Zustand persist middleware can cause hydration issues - ensure proper SSR handling
2. **Audio Permissions**: Browser audio APIs require user interaction - implement proper permission flows
3. **Mobile Performance**: Large transcript lists can cause performance issues - implement virtualization
4. **Type Safety**: Maintain strict TypeScript types when adding new features
5. **Accessibility**: Test with screen readers and keyboard navigation

## 📚 Resources for Further Learning

### Next.js & React
- [Next.js Documentation](https://nextjs.org/docs)
- [React Server Components](https://react.dev/blog/2020/12/21/data-fetching-with-react-server-components)

### State Management
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Hook Form](https://react-hook-form.com/)

### UI/UX
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/)

### AI Integration
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [WebRTC](https://webrtc.org/getting-started/overview)

### Accessibility
- [ARIA Guidelines](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)

---

**Built with ❤️ for sales professionals who want to master their craft.**
#   p i t c h p i l o t n e w  
 #   p i t c h p i l o t a l p h a . 1  
 #   p i t c h p i l o t a l p h a . 1  
 #   p i t c h p i l o t a l p h a . 1  
 "# Pitchpilotalpha0.1" 
