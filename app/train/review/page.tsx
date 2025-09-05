"use client"

// Client page; segment config is defined in server layout.tsx for this route

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Package, User, Target, Zap } from "lucide-react"
import { useSetupSelectionStore, useBuyerPersonaDraftStore, useCallStore, useScenarioStore } from "@/lib/store"
import { DIFFICULTIES } from "@/lib/data"
import { useEffect, useMemo, useRef, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import type { Persona, Scenario } from "@/lib/types"

function ReviewPageInner() {
  const { selectedProduct } = useSetupSelectionStore()
  const { draft } = useBuyerPersonaDraftStore()
  const { setSessionId, setInitialBuyerMessage } = useCallStore()
  const { setScenario } = useScenarioStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  const difficulty = (searchParams.get("difficulty") as keyof typeof DIFFICULTIES) || ("medium" as const)
  const diff = DIFFICULTIES[difficulty]
  const timeLimitSec = (() => {
    const v = searchParams.get("timeLimitSec")
    if (!v) return null
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null
  })()

  const pains = useMemo(() => {
    const raw = draft?.painPoints || ""
    return raw
      .split(/\n+|\r+|\u2022+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }, [draft?.painPoints])

  const handleStartCall = async () => {
    // Generate a session id similar to setup flow
    const sid = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
    setSessionId(sid)

    // Build and persist scenario so /train/call doesn't redirect back to setup
    if (selectedProduct) {
      const scenario: Scenario = {
        product: {
          id: selectedProduct.id,
          name: selectedProduct.name,
          description: selectedProduct.description,
        },
        persona: (draft?.personaName || "custom") as unknown as Persona,
        difficulty,
        brief: {
          background: draft?.background || "",
          pains,
          mindset: draft?.mindset || "",
        },
        timeLimitSec: timeLimitSec ?? null,
      }
      setScenario(scenario)
    }

    // Build payload matching sendScenarioToWebhook shape
    const payload = {
      sessionId: sid,
      product: {
        id: selectedProduct?.id || "custom-product",
        name: selectedProduct?.name || "Custom Product",
        description: selectedProduct?.description || "",
      },
      scenarioSettings: {
        persona: draft?.personaName || "Custom Persona",
        difficulty,
        brief: {
          background: draft?.background || "",
          pains,
          mindset: draft?.mindset || "",
        },
        timeLimitSec: timeLimitSec ?? null,
      },
      buyerProfile: {
        persona: draft?.personaName || "Custom Persona",
        background: draft?.background || "",
        pains,
        mindset: draft?.mindset || "",
      },
      timestamp: Date.now(),
      meta: {
        executionMode: typeof window !== "undefined" ? "proxy-browser" : "proxy-server",
        host: typeof window !== "undefined" ? window.location.host : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        accept: typeof window !== "undefined" ? "*/*" : undefined,
        acceptEncoding: typeof window !== "undefined" ? "gzip, br" : undefined,
        acceptLanguage: typeof navigator !== "undefined" ? (navigator.language || "*") : undefined,
        cacheControl: "no-cache",
      },
    }

    const url = "/api/n8n"
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        cache: "no-store",
      })
      const text = await resp.text()
      let json: any = undefined
      try { json = text ? JSON.parse(text) : undefined } catch {}
      // Log response for challenges autostart visibility
      try {
        console.groupCollapsed("[Challenge] StartCall webhook response")
        console.log("URL:", url, "(proxied)")
        console.log("Status:", resp.status, resp.statusText)
        if (json) {
          console.log("JSON keys:", Object.keys(json))
          console.log("JSON preview:", JSON.stringify(json, null, 2).slice(0, 1000))
        } else {
          console.log("Text preview:", (text || "").slice(0, 1000))
        }
        console.groupEnd()
      } catch {}
      const aiMsg = (json && (json["AI output"] || json.message || json.text || json.reply)) || text || null
      setInitialBuyerMessage(aiMsg)
      // Fire-and-forget: record history start (if authenticated)
      try {
        const historyPayload = {
          sessionId: sid,
          product: payload.product,
          persona: payload.scenarioSettings.persona,
          difficulty: payload.scenarioSettings.difficulty,
          status: "started",
          createdAt: Date.now(),
        }
        const histUrl = "/api/history"
        if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
          const blob = new Blob([JSON.stringify(historyPayload)], { type: "application/json" })
          navigator.sendBeacon(histUrl, blob)
        } else {
          fetch(histUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(historyPayload),
            keepalive: true,
            cache: "no-store",
          }).catch(() => {})
        }
      } catch {}
    } catch (e) {
      setInitialBuyerMessage(null)
    } finally {
      router.push("/train/call")
    }
  }

  // Auto-start when requested (e.g., from challenge or Try Again)
  const startedRef = useRef(false)
  useEffect(() => {
    if (searchParams.get("autostart") === "1" && !startedRef.current) {
      startedRef.current = true
      handleStartCall()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Pre-Call Brief</h2>
        <p className="text-muted-foreground">Review your scenario details before starting the call</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Product Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Your Product</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="font-medium">{selectedProduct?.name || "(No product selected)"}</div>
            <p className="text-sm text-muted-foreground">
              {selectedProduct?.description || "Select a product in setup to see details here."}
            </p>
          </CardContent>
        </Card>

        {/* Scenario Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Scenario Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Buyer Persona</span>
              <Badge variant="secondary">{draft?.personaName || "—"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Difficulty</span>
              <Badge>{diff.name}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Score Multiplier</span>
              <Badge variant="outline">{diff.multiplier.toFixed(1)}x</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buyer Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Your Buyer Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Time Limit</span>
            <Badge variant={timeLimitSec ? "secondary" : "outline"}>
              {timeLimitSec ? `${Math.ceil(timeLimitSec / 60)} min` : "Unlimited"}
            </Badge>
          </div>
          <div>
            <div className="font-medium mb-1">😊 Background</div>
            <p className="text-sm">{draft?.background || "—"}</p>
          </div>

          <Separator />

          <div>
            <div className="font-medium mb-1">⚠️ Key Pain Points</div>
            {pains.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {pains.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">—</p>
            )}
          </div>

          <Separator />

          <div>
            <div className="font-medium mb-1">💭 Current Mindset</div>
            <p className="text-sm">{draft?.mindset || "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Quick Tips for Success</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Start with discovery questions to understand their specific needs</li>
            <li>Listen actively and acknowledge their pain points before pitching</li>
            <li>Use specific examples and social proof to build credibility</li>
            <li>Handle objections with empathy using "Feel, Felt, Found"</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Link href="/train/persona" className="text-sm text-muted-foreground hover:underline">Back to persona</Link>
        <Button onClick={handleStartCall} className="text-sm">Start Call →</Button>
      </div>
    </div>
  )
}

// Wrapper with Suspense so useSearchParams can resolve on the client during build/runtime
export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><p>Loading…</p></div>}>
      <ReviewPageInner />
    </Suspense>
  )
}
