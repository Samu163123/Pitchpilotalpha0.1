"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CallHeader } from "@/components/call-header"
import { TranscriptList } from "@/components/transcript-list"
import { CallControls } from "@/components/call-controls"
import { CoachHintsPanel } from "@/components/coach-hints-panel"
import { BuyerNotesPanel } from "@/components/buyer-notes-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PanelRightClose, PanelRightOpen, Loader2 } from "lucide-react"
import { useScenarioStore, useCallStore, useHistoryStore, useProfileStore } from "@/lib/store"
import { evaluateCall } from "@/lib/simulator"
import { useToast } from "@/hooks/use-toast"
import { sendUserMessageToWebhook } from "@/lib/webhook"
import { sendAnalysisWebhook } from "@/lib/webhook"

export default function CallPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { scenario } = useScenarioStore()
  const { isActive, transcript, metrics, startTime, hintsEnabled, startCall, endCall, addSegment, clearCall, sessionId, setSessionId, initialBuyerMessage, setInitialBuyerMessage } =
    useCallStore()
  const { addSession } = useHistoryStore()
  const { addPoints, updateStreak, voiceSpeed } = useProfileStore()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userInput, setUserInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [decision, setDecision] = useState<"accepted" | "declined" | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [aiTyping, setAiTyping] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<"hints" | "notes">("hints")
  const initialAddedRef = useRef(false)
  // Inline error + resend support
  const [errorBelowTs, setErrorBelowTs] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [lastUser, setLastUser] = useState<{ text: string; ts: number } | null>(null)

  // Timer bonus management
  const [bonusAccumSec, setBonusAccumSec] = useState(0)
  const [bonusFlashSec, setBonusFlashSec] = useState<number | null>(null)

  const computeRemainingSec = () => {
    if (!scenario || !startTime || !scenario.timeLimitSec || scenario.timeLimitSec <= 0) return null
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    return Math.max(0, scenario.timeLimitSec + bonusAccumSec - elapsed)
  }

  useEffect(() => {
    if (!scenario) return
    if (!isActive) {
      console.debug("[Call] Starting call session")
      startCall(scenario)
    }
  }, [scenario, isActive, startCall])

  // Ensure we have a sessionId even if user navigates directly to /train/call
  useEffect(() => {
    if (sessionId) return
    const sid = typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)
    console.debug("[Call] Generated new sessionId on call page:", sid)
    setSessionId(sid)
  }, [sessionId, setSessionId])

  useEffect(() => {
    if (!scenario || !isActive || !initialBuyerMessage || initialAddedRef.current) return
    initialAddedRef.current = true
    let aiText = String(initialBuyerMessage)
    const decisionMatch = aiText.match(/\{\s*"decision"\s*:\s*"(accepted|declined)"\s*\}\s*$/i)
    if (decisionMatch) {
      setDecision(decisionMatch[1].toLowerCase() as any)
      aiText = aiText.replace(decisionMatch[0], "").trim()
    }
    const addMatch = aiText.match(/\[add:\s*(\d+)\s*\]\s*$/i)
    if (addMatch) {
      const addSec = Math.max(0, parseInt(addMatch[1], 10) || 0)
      aiText = aiText.replace(addMatch[0], "").trim()
      const before = computeRemainingSec()
      const timeCapped = typeof before === "number" && before <= 120
      const hasLimit = !!(scenario.timeLimitSec && scenario.timeLimitSec > 0)
      if (addSec > 0 && hasLimit && timeCapped) {
        setBonusAccumSec((v) => v + addSec)
        setBonusFlashSec(addSec)
        console.debug(`[Timer] Applied initial bonus +${addSec}s (before=${before}s)`) 
      } else {
        console.debug(`[Timer] Ignored initial bonus +${addSec}s (before=${before}s, hasLimit=${hasLimit})`) 
      }
    }
    const ts = Date.now()
    if (aiText && aiText.trim()) {
      addSegment({ role: "buyer", text: aiText.trim(), timestamp: ts })
      speak(aiText.trim())
    }
    // Prevent reuse if navigating back
    setInitialBuyerMessage(null)
  }, [scenario, isActive, initialBuyerMessage])

  const handleSendMessage = async () => {
    if (!userInput.trim() || !scenario || !sessionId) {
      console.warn("[Call] handleSendMessage: blocked (trimmed?", !!userInput.trim(), "scenario?", !!scenario, "sessionId?", !!sessionId, ")")
      return
    }

    const text = userInput.trim()

    console.groupCollapsed("[Call] Sending user message")
    console.debug("sessionId:", sessionId)
    console.debug("user text:", text)

    // Add user message
    const userSegTs = Date.now()
    addSegment({
      role: "user",
      text,
      timestamp: userSegTs,
    })
    console.debug("Added user segment at", userSegTs)

    setUserInput("")
    setLastUser({ text, ts: userSegTs })
    // clear prior error if any
    setErrorBelowTs(null)
    setErrorMessage(undefined)

    // Ask n8n for the AI reply
    try {
      setAiTyping(true)
      console.time("sendUserMessageToWebhook")
      const remaining = computeRemainingSec()
      const result = await sendUserMessageToWebhook(sessionId, text, scenario, remaining)
      console.timeEnd("sendUserMessageToWebhook")

      console.debug("Webhook result status:", result.status, "ok:", result.ok)
      if (result.text) console.debug("Webhook result text preview:", result.text.slice(0, 300))
      if (result.json) console.debug("Webhook result json keys:", Object.keys(result.json))

      let aiText =
        (result.json && (result.json["AI output"] || result.json.message || result.json.text || result.json.reply)) ||
        result.text ||
        ""

      console.debug("Parsed aiText length:", aiText ? aiText.length : 0)

      // Detect trailing hidden JSON decision {"decision":"accepted|declined"}
      let detectedDecision: "accepted" | "declined" | null = null
      if (aiText && aiText.trim()) {
        const match = aiText.match(/\{\s*"decision"\s*:\s*"(accepted|declined)"\s*\}\s*$/i)
        if (match) {
          detectedDecision = match[1].toLowerCase() as "accepted" | "declined"
          aiText = aiText.replace(match[0], "").trim()
          console.debug("Detected decision:", detectedDecision)
        }
      }

      // Detect and apply trailing time-add token: [add: N]
      if (aiText && aiText.trim()) {
        const addMatch = aiText.match(/\[add:\s*(\d+)\s*\]\s*$/i)
        if (addMatch) {
          const addSec = Math.max(0, parseInt(addMatch[1], 10) || 0)
          aiText = aiText.replace(addMatch[0], "").trim()
          const before = computeRemainingSec()
          const timeCapped = typeof before === "number" && before <= 120
          const hasLimit = !!(scenario.timeLimitSec && scenario.timeLimitSec > 0)
          if (addSec > 0 && hasLimit && timeCapped) {
            setBonusAccumSec((v) => v + addSec)
            setBonusFlashSec(addSec)
            console.debug(`[Timer] Applied bonus +${addSec}s (before=${before}s)`)
          } else {
            console.debug(`[Timer] Ignored bonus +${addSec}s (before=${before}s, hasLimit=${hasLimit})`)
          }
        }
      }

      // If upstream not ok or no displayable text, show inline error + resend
      if (!result.ok || !aiText || !aiText.trim()) {
        console.warn("[Call] No displayable AI reply; showing inline error")
        setErrorBelowTs(userSegTs)
        setErrorMessage(result.ok ? "No reply received." : `Error ${result.status || ''} from server`)
        return
      }

      if (aiText && aiText.trim()) {
        const buyerSegTs = Date.now()
        addSegment({
          role: "buyer",
          text: aiText.trim(),
          timestamp: buyerSegTs,
        })
        console.debug("Added buyer segment at", buyerSegTs)
        // Send AI text to TTS and play audio
        speak(aiText.trim())
      } else {
        console.warn("[Call] Empty AI reply parsed from webhook result")
      }

      if (detectedDecision) {
        setDecision(detectedDecision)
      }
    } catch (err) {
      console.error("[Call] sendUserMessageToWebhook threw error:", err)
      // network/exception -> show inline error
      setErrorBelowTs(userSegTs)
      setErrorMessage("Network error. Tap to resend.")
    } finally {
      setAiTyping(false)
      console.groupEnd()
    }
  }

  const handleResend = async () => {
    if (!lastUser || !scenario || !sessionId) return
    console.groupCollapsed("[Call] Resending last user message")
    try {
      setAiTyping(true)
      setErrorBelowTs(null)
      setErrorMessage(undefined)
      const remaining = computeRemainingSec()
      const result = await sendUserMessageToWebhook(sessionId, lastUser.text, scenario, remaining)
      console.debug("Resend result status:", result.status, "ok:", result.ok)
      let aiText =
        (result.json && (result.json["AI output"] || result.json.message || result.json.text || result.json.reply)) ||
        result.text ||
        ""
      let detectedDecision: "accepted" | "declined" | null = null
      if (aiText && aiText.trim()) {
        const match = aiText.match(/\{\s*"decision"\s*:\s*"(accepted|declined)"\s*\}\s*$/i)
        if (match) {
          detectedDecision = match[1].toLowerCase() as "accepted" | "declined"
          aiText = aiText.replace(match[0], "").trim()
        }
      }
      // Detect and apply trailing time-add token: [add: N]
      if (aiText && aiText.trim()) {
        const addMatch = aiText.match(/\[add:\s*(\d+)\s*\]\s*$/i)
        if (addMatch) {
          const addSec = Math.max(0, parseInt(addMatch[1], 10) || 0)
          aiText = aiText.replace(addMatch[0], "").trim()
          const before = computeRemainingSec()
          const timeCapped = typeof before === "number" && before <= 120
          const hasLimit = !!(scenario.timeLimitSec && scenario.timeLimitSec > 0)
          if (addSec > 0 && hasLimit && timeCapped) {
            setBonusAccumSec((v) => v + addSec)
            setBonusFlashSec(addSec)
            console.debug(`[Timer] Applied bonus +${addSec}s (before=${before}s)`)
          } else {
            console.debug(`[Timer] Ignored bonus +${addSec}s (before=${before}s, hasLimit=${hasLimit})`)
          }
        }
      }
      if (!result.ok || !aiText || !aiText.trim()) {
        setErrorBelowTs(lastUser.ts)
        setErrorMessage(result.ok ? "No reply received. Try again." : `Error ${result.status || ''} from server`)
        return
      }
      const buyerSegTs = Date.now()
      addSegment({ role: "buyer", text: aiText.trim(), timestamp: buyerSegTs })
      speak(aiText.trim())
      if (detectedDecision) setDecision(detectedDecision)
    } catch (e) {
      console.warn("[Call] Resend failed:", e)
      setErrorBelowTs(lastUser.ts)
      setErrorMessage("Network error. Try again.")
    } finally {
      setAiTyping(false)
      console.groupEnd()
    }
  }

  const handleEndCall = async () => {
    if (!scenario) return

    // Show analyzing loader immediately
    console.debug("[Call] handleEndCall: setting analysisLoading=true")
    setAnalysisLoading(true)
    // Stop the call UI but keep page visible
    endCall()

    const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0

    // Prepare container for final feedback (webhook required)
    let finalFeedback = null as any
    let usedWebhook = false

    // Await webhook for AI feedback
    try {
      console.groupCollapsed("[Analysis] Posting transcript to analysis webhook (awaiting response)")
      console.debug("sessionId:", sessionId)
      console.debug("transcript length:", transcript.length)
      console.debug("decision:", decision)
      if (sessionId) {
        const attempt = async () => {
          console.time("sendAnalysisWebhook")
          const r = await sendAnalysisWebhook(sessionId, transcript, scenario, metrics, decision ?? undefined)
          console.timeEnd("sendAnalysisWebhook")
          console.debug("analysis response status:", r.status, "ok:", r.ok)
          if (r.text) console.debug("analysis response text preview:", r.text.slice(0, 300))
          if (r.json) console.debug("analysis response json keys:", Object.keys(r.json))
          return r
        }

        let res = await attempt()
        if (!res.ok) {
          console.warn("[Analysis] First attempt failed; retrying in 5s...")
          await new Promise((resolve) => setTimeout(resolve, 5000))
          res = await attempt()
        }

        if (res.ok) {
          let data: any = res.json
          if (!data && res.text) {
            try {
              data = JSON.parse(res.text)
            } catch (e) {
              console.warn("[Analysis] JSON.parse failed on response text:", e)
            }
          }
          console.debug("[Analysis] Parsed webhook data:", data)
          // Support wrappers like { output: {...} } or { result: {...} }
          const payload = (data && typeof data === "object") ? (data.output ?? data.result ?? data) : null
          if (payload && typeof payload === "object") {
            // Normalize helpers (webhook may return 0-10 scale)
            const to100 = (v: any) => {
              const n = Number(v)
              if (!isFinite(n)) return null
              if (n <= 10) return Math.round(Math.max(0, Math.min(10, n)) * 10)
              return Math.round(Math.max(0, Math.min(100, n)))
            }

            // Aliases for fields from different webhook shapes
            const rawOutcome = (payload as any).outcome ?? (payload as any).result ?? (payload as any).status
            const rawScore = (payload as any).score ?? (payload as any).overall ?? (payload as any).rating ?? (payload as any).totalScore ?? (payload as any).overallScore
            const rawCategories = (payload as any).categories ?? (payload as any).scores ?? (payload as any).metrics?.categories
            const rawMoments = (payload as any).moments ?? (payload as any).highlights
            const rawNextSkill = (payload as any).nextSkill ?? (payload as any).next_skill ?? (payload as any).recommendation ?? (payload as any).next

            const mappedScore = to100(rawScore)

            // Map categories from either object or array
            const mapCategories = (src: any): { objection: number | null; rapport: number | null; closing: number | null; clarity: number | null } => {
              const init = { objection: null as number | null, rapport: null as number | null, closing: null as number | null, clarity: null as number | null }
              if (!src) return init
              if (Array.isArray(src)) {
                for (const c of src) {
                  const name = String(c.name || c.key || c.category || '').toLowerCase()
                  const val = to100((c.score ?? c.value ?? c.points))
                  if (name.includes('object')) init.objection = val
                  else if (name.includes('rapport') || name.includes('relationship')) init.rapport = val
                  else if (name.includes('clos')) init.closing = val
                  else if (name.includes('clar') || name.includes('communicat')) init.clarity = val
                }
                return init
              }
              // object path
              return {
                objection: to100(src.objection ?? src.handle_objections ?? src.objections),
                rapport: to100(src.rapport ?? src.relationship ?? src.trust),
                closing: to100(src.closing ?? src.close ?? src.deal_closing),
                clarity: to100(src.clarity ?? src.communication ?? src.explanation)
              }
            }
            const mappedCategories = mapCategories(rawCategories)

            // Validate that we have at least one meaningful field
            const anyCategoryPresent = (
              mappedCategories.objection !== null ||
              mappedCategories.rapport !== null ||
              mappedCategories.closing !== null ||
              mappedCategories.clarity !== null
            )
            const hasMeaningful = Boolean(mappedScore !== null || anyCategoryPresent)

            if (hasMeaningful) {
              finalFeedback = {
                outcome: String(rawOutcome || '').toLowerCase() === 'win' ? 'win' : 'loss',
                score: mappedScore ?? 0,
                categories: {
                  objection: mappedCategories.objection ?? 0,
                  rapport: mappedCategories.rapport ?? 0,
                  closing: mappedCategories.closing ?? 0,
                  clarity: mappedCategories.clarity ?? 0,
                },
                moments: Array.isArray(rawMoments)
                  ? rawMoments.map((m: any) => ({
                      timestamp: Number(m.timestamp) || Date.now(),
                      title: String(m.title || 'Moment'),
                      whatWorked: String(m.whatWorked || m.what_worked || ''),
                      tryInstead: String(m.tryInstead || m.try_instead || ''),
                    }))
                  : [],
                nextSkill: String(rawNextSkill || ''),
              }
              usedWebhook = true
              console.debug("[Analysis] Using AI feedback from webhook (mapped):", finalFeedback)
            } else {
              console.warn("[Analysis] Webhook JSON lacked expected fields; waiting without applying zeros.")
            }
          } else {
            console.warn("[Analysis] Empty/invalid JSON in webhook response; waiting for valid shape")
          }
        } else {
          console.error("[Analysis] Non-OK or no response after retry", { status: res.status, text: res.text })
        }
      }
      console.groupEnd()
    } catch (err) {
      console.error("[Analysis] Error sending/processing analysis webhook:", err)
    }

    // Only proceed when webhook returned OK and mapped feedback
    if (usedWebhook && finalFeedback) {
      const session = {
        id: Math.random().toString(36).substr(2, 9),
        createdAt: Date.now(),
        scenario,
        transcript,
        feedback: finalFeedback,
        duration,
      }
      console.debug("[Analysis] Saving session with AI feedback:", session)
      addSession(session)
      const points = Math.round(finalFeedback.score * 10)
      addPoints(points)
      updateStreak()
      clearCall()
      console.debug("[Call] handleEndCall: setting analysisLoading=false and navigating to /train/feedback")
      setAnalysisLoading(false)
      router.push("/train/feedback")
    } else {
      // Keep spinner and do not navigate or show fallback
      console.warn("[Analysis] No valid AI feedback received yet; keeping loading state visible.")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Same-origin proxy endpoint for TTS upload to avoid CORS
  const LOCAL_UPLOAD_ENDPOINT_BASE = "/upload?sid="

  // Attempt to fetch and play remote TTS audio; returns true if audio was played
  const tryPlayRemoteTTS = async (text: string): Promise<boolean> => {
    try {
      if (!sessionId) return false
      // Poll our /upload store a few times for freshly uploaded audio from n8n
      const attempts = 4
      const delayMs = 350
      for (let i = 0; i < attempts; i++) {
        const getUrl = `${LOCAL_UPLOAD_ENDPOINT_BASE}${encodeURIComponent(sessionId)}&pop=1`
        const resp = await fetch(getUrl, { method: "GET", cache: "no-store" })
        const ctype = resp.headers.get("content-type") || ""
        if (resp.ok && /^audio\//i.test(ctype)) {
          const blob = await resp.blob()
          const objectUrl = URL.createObjectURL(blob)
          const audio = new Audio(objectUrl)
          audio.onended = () => URL.revokeObjectURL(objectUrl)
          await audio.play()
          return true
        }
        // 404 means not ready yet; small delay then retry
        await new Promise(r => setTimeout(r, delayMs))
      }
      return false
    } catch (e) {
      console.warn("[TTS] Remote TTS fetch/play failed:", e)
      return false
    }
  }

  // Simple TTS helper (browser-only) with remote-audio-first, speechSynthesis fallback
  const speak = async (text: string) => {
    // 1) Try remote TTS audio first
    const playedRemote = await tryPlayRemoteTTS(text)
    if (playedRemote) return

    // 2) Fallback to browser speech synthesis
    try {
      if (typeof window === "undefined") return
      const synth = (window as any).speechSynthesis as SpeechSynthesis | undefined
      if (!synth || typeof (window as any).SpeechSynthesisUtterance === "undefined") return
      const utter = new (window as any).SpeechSynthesisUtterance(text)
      const rate = typeof voiceSpeed === "number" && isFinite(voiceSpeed) ? voiceSpeed : 1
      utter.rate = Math.max(0.5, Math.min(2, rate))
      synth.speak(utter)
    } catch (e) {
      console.warn("[TTS] speak fallback failed:", e)
    }
  }

  // Show analysis loader when waiting for webhook
  if (analysisLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Analyzing your call and preparing feedback...</p>
        </div>
      </div>
    )
  }

  if (!scenario || !isActive) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Starting your call...</p>
        </div>
      </div>
    )
  }

  const currentRemaining = computeRemainingSec()

  return (
    <div className="h-screen flex flex-col">
      {/* Call Header */}
      <CallHeader scenario={scenario} duration={callDuration} isActive={isActive} remainingSec={currentRemaining ?? undefined} bonusFlashSec={bonusFlashSec} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Call Area */}
        <div className="flex-1 flex flex-col">
          {/* Transcript */}
          <div className="flex-1 overflow-hidden relative">
            <TranscriptList transcript={transcript} errorBelowTs={errorBelowTs} errorMessage={errorMessage || undefined} onResend={handleResend} />
            {aiTyping && (
              <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-background/80 backdrop-blur rounded-md px-3 py-1 border text-sm text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>AI is typing…</span>
              </div>
            )}
            {decision && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="pointer-events-auto bg-background/90 backdrop-blur border rounded-md p-6 shadow-lg text-center">
                  <p className="mb-4 text-sm text-muted-foreground">
                    Conversation concluded ({decision}). You can end the call to see feedback.
                  </p>
                  <Button variant="destructive" onClick={handleEndCall}>End Call</Button>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <CallControls
            userInput={userInput}
            setUserInput={setUserInput}
            onSendMessage={handleSendMessage}
            onEndCall={handleEndCall}
            onKeyPress={handleKeyPress}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            disabledInput={!!decision}
          />
        </div>

        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 overflow-hidden border-l bg-muted/30`}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Coach Panel</h3>
              <div className="flex items-center gap-2">
                {sidebarTab === 'notes' && (
                  <Button variant="secondary" size="sm" onClick={() => setSidebarTab('hints')}>Hints</Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                  <PanelRightClose className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as any)} className="h-full flex flex-col">
                {sidebarTab !== 'notes' && (
                  <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
                    <TabsTrigger value="hints">Hints</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>
                )}

                <TabsContent value="hints" forceMount className="flex-1 overflow-hidden m-0">
                  <CoachHintsPanel enabled={hintsEnabled} transcript={transcript} scenario={scenario} sessionId={sessionId} onInsertText={(text) => setUserInput(text)} />
                </TabsContent>

                <TabsContent value="notes" className="flex-1 overflow-hidden m-0">
                  <BuyerNotesPanel transcript={transcript} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Sidebar Toggle (when closed) */}
        {!sidebarOpen && (
          <div className="w-12 border-l bg-muted/30 flex items-center justify-center">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
              <PanelRightOpen className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
