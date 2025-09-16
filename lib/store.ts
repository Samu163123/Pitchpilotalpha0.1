"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Scenario, TranscriptSegment, Session, CallMetrics } from "./types"

interface ScenarioStore {
  scenario: Scenario | null
  setScenario: (scenario: Scenario) => void
  clearScenario: () => void
}

interface CallStore {
  isActive: boolean
  transcript: TranscriptSegment[]
  metrics: CallMetrics
  startTime: number | null
  hintsEnabled: boolean
  sessionId: string | null
  initialBuyerMessage: string | null
  startCall: (scenario: Scenario) => void
  endCall: () => void
  addSegment: (segment: Omit<TranscriptSegment, "id">) => void
  setHintsEnabled: (enabled: boolean) => void
  clearCall: () => void
  setSessionId: (id: string) => void
  setInitialBuyerMessage: (msg: string | null) => void
}

interface HistoryStore {
  sessions: Session[]
  addSession: (session: Session) => void
  getSessionById: (id: string) => Session | undefined
  clearAll: () => void
}

interface ProfileStore {
  points: number
  level: number
  streak: number
  audioDevice: string
  voiceSpeed: number
  addPoints: (points: number) => void
  updateStreak: () => void
  setAudioDevice: (device: string) => void
  setVoiceSpeed: (speed: number) => void
}

export const useScenarioStore = create<ScenarioStore>()(
  persist(
    (set) => ({
      scenario: null,
      setScenario: (scenario) => set({ scenario }),
      clearScenario: () => set({ scenario: null }),
    }),
    {
      name: "pitchpilot-scenario",
    },
  ),
)

export const useCallStore = create<CallStore>()((set, get) => ({
  isActive: false,
  transcript: [],
  metrics: {
    talkTimeRatio: 0,
    questionCount: 0,
    closesCount: 0,
    interruptionCount: 0,
  },
  startTime: null,
  hintsEnabled: true,
  sessionId: null,
  initialBuyerMessage: null,
  startCall: (scenario) =>
    set({
      isActive: true,
      transcript: [],
      metrics: {
        talkTimeRatio: 0,
        questionCount: 0,
        closesCount: 0,
        interruptionCount: 0,
      },
      startTime: Date.now(),
    }),
  endCall: () => set({ isActive: false }),
  addSegment: (segment) => {
    const newSegment = {
      ...segment,
      id: Math.random().toString(36).substr(2, 9),
    }
    set((state) => {
      const newTranscript = [...state.transcript, newSegment]

      // Update metrics
      const userSegments = newTranscript.filter((s) => s.role === "user")
      const buyerSegments = newTranscript.filter((s) => s.role === "buyer")

      const questionCount = userSegments.filter((s) =>
        /^(who|what|when|where|why|how|would|could|can|do|does|did|is|are|will)/i.test(s.text.trim()),
      ).length

      const closesCount = userSegments.filter((s) =>
        /would it make sense|next step|move forward|ready to|shall we/i.test(s.text),
      ).length

      const talkTimeRatio = userSegments.length / Math.max(buyerSegments.length, 1)

      return {
        transcript: newTranscript,
        metrics: {
          ...state.metrics,
          talkTimeRatio,
          questionCount,
          closesCount,
        },
      }
    })
  },
  setHintsEnabled: (enabled) => set({ hintsEnabled: enabled }),
  clearCall: () =>
    set({
      isActive: false,
      transcript: [],
      metrics: {
        talkTimeRatio: 0,
        questionCount: 0,
        closesCount: 0,
        interruptionCount: 0,
      },
      startTime: null,
      sessionId: null,
      initialBuyerMessage: null,
    }),
  setSessionId: (id) => set({ sessionId: id }),
  setInitialBuyerMessage: (msg) => set({ initialBuyerMessage: msg }),
}))

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions],
        })),
      getSessionById: (id) => get().sessions.find((s) => s.id === id),
      clearAll: () => set({ sessions: [] }),
    }),
    {
      name: "pitchpilot-history",
    },
  ),
)

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      points: 0,
      level: 1,
      streak: 0,
      audioDevice: "default",
      voiceSpeed: 1.0,
      addPoints: (points) =>
        set((state) => {
          const newPoints = state.points + points
          const newLevel = Math.floor(newPoints / 1000) + 1
          return { points: newPoints, level: newLevel }
        }),
      updateStreak: () => set((state) => ({ streak: state.streak + 1 })),
      setAudioDevice: (device) => set({ audioDevice: device }),
      setVoiceSpeed: (speed) => set({ voiceSpeed: speed }),
    }),
    {
      name: "pitchpilot-profile",
    },
  ),
)

// Buyer Persona draft store for AI/manual input
export interface BuyerPersonaDraft {
  personaName: string
  background: string
  demographics?: string
  psychographics?: string
  painPoints: string
  mindset: string
  quote?: string
}

interface BuyerPersonaDraftStore {
  draft: BuyerPersonaDraft | null
  setDraft: (d: BuyerPersonaDraft) => void
  clearDraft: () => void
}

export const useBuyerPersonaDraftStore = create<BuyerPersonaDraftStore>()(
  persist(
    (set) => ({
      draft: null,
      setDraft: (d) => set({ draft: d }),
      clearDraft: () => set({ draft: null }),
    }),
    { name: "pitchpilot-buyer-persona-draft" },
  ),
)

// Setup selection store to share product with Buyer Persona page
interface SetupSelectionStore {
  selectedProduct: { id: string; name: string; description: string } | null
  setSelectedProduct: (p: { id: string; name: string; description: string } | null) => void
}

export const useSetupSelectionStore = create<SetupSelectionStore>()(
  persist(
    (set) => ({
      selectedProduct: null,
      setSelectedProduct: (p) => set({ selectedProduct: p }),
    }),
    { name: "pitchpilot-setup-selection" },
  ),
)

// Language/i18n store
export type LanguageCode =
  | "en"
  | "zh"
  | "hi"
  | "es"
  | "fr"
  | "ar"
  | "bn"
  | "pt"
  | "ru"
  | "ur"
  | "id"
  | "de"
  | "ja"
  | "tr"
  | "ko"
  | "vi"
  | "it"
  | "fa"
  | "th"
  | "sw"
  | "tl"
  | "pl"
  | "uk"
  | "nl"
  | "hu"
  | "cs"
  | "sv"
  | "el"
  | "he"
  | "fi"
  | "da"
  | "no"

interface LanguageStore {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  hasChosenLanguage: boolean
  setHasChosenLanguage: (v: boolean) => void
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (language) => set({ language }),
      hasChosenLanguage: false,
      setHasChosenLanguage: (hasChosenLanguage) => set({ hasChosenLanguage }),
    }),
    { name: "pitchpilot-language" },
  ),
)
