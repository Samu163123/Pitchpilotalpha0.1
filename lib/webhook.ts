import type { Scenario, TranscriptSegment, CallMetrics } from "./types"

// Public (client) URL is no longer required when using API proxy, but keep fallback for SSR/edge
const PUBLIC_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ??
  "https://kdawi.app.n8n.cloud/webhook/8a782625-9127-4afa-a348-7b1866716252"

// Server-side direct URL (used by API route); included here as fallback if ever called server-side
const SERVER_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? PUBLIC_WEBHOOK_URL

// In browser, post to our API proxy to avoid CORS; otherwise use server URL
const WEBHOOK_ENDPOINT = typeof window !== "undefined" ? "/api/n8n" : SERVER_WEBHOOK_URL

// Fixed analysis URL to receive full chat log after call end
const ANALYSIS_WEBHOOK_URL = "https://kdawi.app.n8n.cloud/webhook-test/c7f1ebc9-edae-4258-802a-dbb4a5f28317"
// Use server proxy in browser to avoid CORS
const ANALYSIS_ENDPOINT = typeof window !== "undefined" ? "/api/analysis" : ANALYSIS_WEBHOOK_URL

// Fixed hints URL to request coaching hints during the call/sidebar
const HINTS_WEBHOOK_URL = "https://kdawi.app.n8n.cloud/webhook-test/fde08c80-ae05-46a6-9cbf-49aa8c28826f"
// Use server proxy in browser to avoid CORS
const HINTS_ENDPOINT = typeof window !== "undefined" ? "/api/hints" : HINTS_WEBHOOK_URL

export interface WebhookPayload {
  sessionId: string
  product: {
    id: string
    name: string
    description: string
  }
  scenarioSettings: {
    persona: string
    difficulty: string
    brief: {
      background: string
      pains: string[]
      mindset: string
    }
    // Optional max duration for the call in seconds (null/omitted = unlimited)
    timeLimitSec?: number | null
  }
  buyerProfile: {
    persona: string
    background: string
    pains: string[]
    mindset: string
  }
  timestamp: number
  meta?: MetaFields
}

export interface UserMessagePayload {
  sessionId: string
  type: "user_message"
  userMessage: string
  // Remaining time when the user sent the message (in seconds). null for unlimited.
  remainingTimeSec?: number | null
  product: {
    id: string
    name: string
    description: string
  }
  scenarioSettings: {
    persona: string
    difficulty: string
    brief: {
      background: string
      pains: string[]
      mindset: string
    }
    timeLimitSec?: number | null
  }
  buyerProfile: {
    persona: string
    background: string
    pains: string[]
    mindset: string
  }
  timestamp: number
  meta?: MetaFields
}

export interface WebhookResult {
  ok: boolean
  status: number
  json?: any
  text?: string
}

interface MetaFields {
  webhookUrl?: string
  executionMode?: "proxy-browser" | "proxy-server"
  host?: string
  userAgent?: string
  accept?: string
  acceptEncoding?: string
  acceptLanguage?: string
  cacheControl?: string
}

function buildMeta(): MetaFields {
  // Best-effort to include fields similar to what n8n saw on first request
  const isBrowser = typeof window !== "undefined"
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "node"
  const host = isBrowser ? window.location.host : undefined
  const accept = isBrowser ? "*/*" : undefined
  const acceptEncoding = isBrowser ? "gzip, br" : undefined
  const acceptLanguage = isBrowser ? (navigator.language || "*") : undefined
  const cacheControl = "no-cache"
  return {
    webhookUrl: typeof process !== "undefined" ? (process.env.N8N_WEBHOOK_URL ?? process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ?? undefined) : undefined,
    executionMode: isBrowser ? "proxy-browser" : "proxy-server",
    host,
    userAgent: ua,
    accept,
    acceptEncoding,
    acceptLanguage,
    cacheControl,
  }
}

export async function sendScenarioToWebhook(scenario: Scenario, sessionId: string): Promise<WebhookResult> {
  const payload: WebhookPayload = {
    sessionId,
    product: {
      id: scenario.product.id,
      name: scenario.product.name,
      description: scenario.product.description,
    },
    scenarioSettings: {
      persona: scenario.persona,
      difficulty: scenario.difficulty,
      brief: scenario.brief,
      timeLimitSec: scenario.timeLimitSec ?? null,
    },
    buyerProfile: {
      persona: scenario.persona,
      background: scenario.brief.background,
      pains: scenario.brief.pains,
      mindset: scenario.brief.mindset,
    },
    timestamp: Date.now(),
    meta: buildMeta(),
  }

  console.groupCollapsed("[Webhook] sendScenarioToWebhook")
  console.debug("endpoint:", WEBHOOK_ENDPOINT)
  console.debug("sessionId:", sessionId)
  console.debug("product:", payload.product)
  console.debug("scenarioSettings.persona/difficulty:", payload.scenarioSettings.persona, payload.scenarioSettings.difficulty)

  try {
    console.time("[Webhook] scenario fetch")
    const response = await fetch(WEBHOOK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      cache: "no-store",
    })
    console.timeEnd("[Webhook] scenario fetch")

    const bodyText = await safeReadText(response)
    const bodyJson = tryParseJSON(bodyText)

    console.debug("response status:", response.status, response.statusText)
    console.debug("response content-type:", response.headers.get("content-type"))
    console.debug("response text length:", bodyText ? bodyText.length : 0)

    if (!response.ok) {
      console.warn("Webhook proxy request not OK", {
        status: response.status,
        statusText: response.statusText,
        bodyLen: bodyText ? bodyText.length : 0,
      })
      console.groupEnd()
      return { ok: false, status: response.status, text: bodyText, json: bodyJson }
    } else {
      console.log("Scenario data sent via proxy successfully")
      console.groupEnd()
      return { ok: true, status: response.status, text: bodyText, json: bodyJson }
    }
  } catch (error) {
    console.warn("Fetch to webhook proxy failed; attempting sendBeacon fallback:", error)
  }

  // Fallback beacon to the proxy as well (still avoids CORS)
  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" })
      const queued = navigator.sendBeacon(WEBHOOK_ENDPOINT, blob)
      console.log("sendBeacon to proxy queued:", queued)
      console.groupEnd()
      return { ok: queued, status: queued ? 200 : 0 }
    }
  } catch (beaconErr) {
    console.warn("sendBeacon to proxy failed:", beaconErr)
  }

  console.groupEnd()
  return { ok: false, status: 0 }
}

export async function sendUserMessageToWebhook(
  sessionId: string,
  userMessage: string,
  scenario: Scenario,
  remainingTimeSec?: number | null,
): Promise<WebhookResult> {
  const payload: UserMessagePayload = {
    sessionId,
    type: "user_message",
    userMessage,
    remainingTimeSec: typeof remainingTimeSec === "number" ? Math.max(0, Math.floor(remainingTimeSec)) : (remainingTimeSec ?? null),
    product: {
      id: scenario.product.id,
      name: scenario.product.name,
      description: scenario.product.description,
    },
    scenarioSettings: {
      persona: scenario.persona,
      difficulty: scenario.difficulty,
      brief: scenario.brief,
      timeLimitSec: scenario.timeLimitSec ?? null,
    },
    buyerProfile: {
      persona: scenario.persona,
      background: scenario.brief.background,
      pains: scenario.brief.pains,
      mindset: scenario.brief.mindset,
    },
    timestamp: Date.now(),
    meta: buildMeta(),
  }

  console.groupCollapsed("[Webhook] sendUserMessageToWebhook")
  console.debug("endpoint:", WEBHOOK_ENDPOINT)
  console.debug("sessionId:", sessionId)
  console.debug("userMessage length:", userMessage.length)
  console.debug("persona/difficulty:", payload.scenarioSettings.persona, payload.scenarioSettings.difficulty)

  try {
    console.time("[Webhook] userMessage fetch")
    const response = await fetch(WEBHOOK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      cache: "no-store",
    })
    console.timeEnd("[Webhook] userMessage fetch")

    const bodyText = await safeReadText(response)
    const bodyJson = tryParseJSON(bodyText)

    console.debug("response status:", response.status, response.statusText)
    console.debug("response content-type:", response.headers.get("content-type"))
    console.debug("response text length:", bodyText ? bodyText.length : 0)

    if (!response.ok) {
      console.warn("Webhook proxy request not OK (user message)", {
        status: response.status,
        statusText: response.statusText,
        bodyLen: bodyText ? bodyText.length : 0,
      })
      console.groupEnd()
      return { ok: false, status: response.status, text: bodyText, json: bodyJson }
    } else {
      console.groupEnd()
      return { ok: true, status: response.status, text: bodyText, json: bodyJson }
    }
  } catch (error) {
    console.warn("Fetch to webhook proxy failed (user message); attempting sendBeacon fallback:", error)
  }

  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" })
      const queued = navigator.sendBeacon(WEBHOOK_ENDPOINT, blob)
      console.groupEnd()
      return { ok: queued, status: queued ? 200 : 0 }
    }
  } catch (beaconErr) {
    console.warn("sendBeacon to proxy failed (user message):", beaconErr)
  }

  console.groupEnd()
  return { ok: false, status: 0 }
}

export async function sendAnalysisWebhook(
  sessionId: string,
  transcript: TranscriptSegment[],
  scenario: Scenario,
  metrics: CallMetrics,
  decision?: "accepted" | "declined",
): Promise<WebhookResult> {
  // Build plain text transcript for easier consumption downstream
  const transcriptPlain = transcript
    .map(seg => `${seg.role === "buyer" ? "Buyer" : "User"}: ${seg.text}`)
    .join("\n")

  // Debug: transcript summary
  try {
    console.groupCollapsed("[Webhook] Analysis payload preview")
    console.debug("sessionId:", sessionId)
    console.debug("segments:", transcript.length)
    console.debug("transcriptPlain lines/chars:", transcriptPlain.split("\n").length, "/", transcriptPlain.length)
    console.debug("transcriptPlain preview:", transcriptPlain.slice(0, 300))
    console.groupEnd()
  } catch {}

  const payload = {
    type: "call_completed",
    sessionId,
    decision: decision ?? null,
    scenario: {
      ...scenario,
      timeLimitSec: scenario.timeLimitSec ?? null,
    },
    metrics,
    transcript,
    // New plain text version of the transcript
    transcriptPlain,
    timestamp: Date.now(),
    meta: buildMeta(),
  }

  console.groupCollapsed("[Webhook] sendAnalysisWebhook")
  console.debug("endpoint:", ANALYSIS_ENDPOINT)
  console.debug("sessionId:", sessionId)
  try {
    const payloadStr = JSON.stringify(payload)
    console.debug("payload bytes:", new TextEncoder().encode(payloadStr).length)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    let resp = await fetch(ANALYSIS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payloadStr,
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeout)

    // retry once on network error or 5xx
    if (!resp.ok && resp.status >= 500) {
      console.warn("[Webhook] analysis first attempt failed with status", resp.status, "— retrying once")
      const controller2 = new AbortController()
      const timeout2 = setTimeout(() => controller2.abort(), 15000)
      resp = await fetch(ANALYSIS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payloadStr,
        cache: "no-store",
        signal: controller2.signal,
      })
      clearTimeout(timeout2)
    }

    const text = await safeReadText(resp)
    const json = tryParseJSON(text)

    try {
      console.debug("analysis headers content-type:", resp.headers.get("content-type"))
      console.debug("analysis body length:", text ? text.length : 0)
      if (text) console.debug("analysis text preview:", text.slice(0, 300))
      if (json) console.debug("analysis json keys:", Object.keys(json))
    } catch {}

    console.debug("analysis status:", resp.status, "ok:", resp.ok)
    console.groupEnd()
    return { ok: resp.ok, status: resp.status, text, json }
  } catch (e) {
    console.warn("[Webhook] sendAnalysisWebhook failed:", e)
    console.groupEnd()
    return { ok: false, status: 0 }
  }
}

export async function sendHintsWebhook(
  sessionId: string,
  transcript: TranscriptSegment[],
  scenario: Scenario,
): Promise<WebhookResult> {
  // Build plain text transcript for easier consumption downstream
  const transcriptPlain = transcript
    .map(seg => `${seg.role === "buyer" ? "Buyer" : "User"}: ${seg.text}`)
    .join("\n")

  const payload = {
    type: "get_hints",
    sessionId,
    scenario: { ...scenario, timeLimitSec: scenario.timeLimitSec ?? null },
    product: scenario.product,
    scenarioSettings: {
      persona: scenario.persona,
      difficulty: scenario.difficulty,
      brief: scenario.brief,
      timeLimitSec: scenario.timeLimitSec ?? null,
    },
    buyerProfile: {
      persona: scenario.persona,
      background: scenario.brief.background,
      pains: scenario.brief.pains,
      mindset: scenario.brief.mindset,
    },
    transcript,
    transcriptPlain,
    timestamp: Date.now(),
    meta: buildMeta(),
  }

  console.groupCollapsed("[Webhook] sendHintsWebhook")
  console.debug("endpoint:", HINTS_ENDPOINT)
  console.debug("sessionId:", sessionId)
  try {
    const payloadStr = JSON.stringify(payload)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const resp = await fetch(HINTS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payloadStr,
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const text = await safeReadText(resp)
    const json = tryParseJSON(text)

    console.debug("hints status:", resp.status, "ok:", resp.ok)
    console.groupEnd()
    return { ok: resp.ok, status: resp.status, text, json }
  } catch (e) {
    console.warn("[Webhook] sendHintsWebhook failed:", e)
    console.groupEnd()
    return { ok: false, status: 0 }
  }
}

// Buyer Persona generation helper
export interface PersonaGenerateRequest {
  product: { name: string; description: string }
  // traits object with any fields the user already filled
  traits?: Partial<{
    personaName: string
    background: string
    demographics: string
    psychographics: string
    painPoints: string
    mindset: string
    quote: string
  }>
  // keys of fields to generate
  generateFields?: Array<"personaName" | "background" | "demographics" | "psychographics" | "painPoints" | "mindset" | "quote">
  // new: market type and number of persona options to generate
  marketType?: "B2B" | "B2C"
  count?: number
}

export async function generateBuyerPersona(req: PersonaGenerateRequest): Promise<WebhookResult> {
  try {
    const resp = await fetch(typeof window !== "undefined" ? "/api/persona" : "http://localhost/api/persona", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      cache: "no-store",
    })
    const text = await safeReadText(resp)
    const json = tryParseJSON(text)
    return { ok: resp.ok, status: resp.status, text, json }
  } catch (e) {
    console.warn("[Webhook] generateBuyerPersona failed:", e)
    return { ok: false, status: 0 }
  }
}

function tryParseJSON(text?: string) {
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

async function safeReadText(response: Response): Promise<string | undefined> {
  try {
    return await response.text()
  } catch {
    return undefined
  }
}
