"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useSetupSelectionStore, useBuyerPersonaDraftStore } from "@/lib/store"
import { generateBuyerPersona, type PersonaGenerateRequest } from "@/lib/webhook"
import { useToast } from "@/hooks/use-toast"

const REVIEW_ROUTE = "/train/review" // TODO: adjust if your review page path differs

export default function BuyerPersonaPage() {
  const router = useRouter()
  const { selectedProduct } = useSetupSelectionStore()
  const { draft, setDraft } = useBuyerPersonaDraftStore()
  const { toast } = useToast()

  const [personaName, setPersonaName] = useState(draft?.personaName ?? "")
  const [background, setBackground] = useState(draft?.background ?? "")
  const [demographics, setDemographics] = useState(draft?.demographics ?? "")
  const [psychographics, setPsychographics] = useState(draft?.psychographics ?? "")
  const [painPoints, setPainPoints] = useState(draft?.painPoints ?? "")
  const [mindset, setMindset] = useState(draft?.mindset ?? "")
  const [quote, setQuote] = useState(draft?.quote ?? "")
  const [gen, setGen] = useState<Record<string, boolean>>({ personaName: true, background: true, demographics: false, psychographics: false, painPoints: true, mindset: true, quote: true })
  const [loading, setLoading] = useState(false)
  const [marketType, setMarketType] = useState<"B2B" | "B2C">("B2C")
  const [options, setOptions] = useState<any[] | null>(null)
  const [edited, setEdited] = useState<any[] | null>(null)
  const [editMode, setEditMode] = useState<Record<number, boolean>>({})

  useEffect(() => { if (!selectedProduct) router.replace("/train/setup") }, [selectedProduct, router])

  const generateFields = useMemo(() => (Object.keys(gen) as Array<keyof typeof gen>).filter((k) => gen[k]) as PersonaGenerateRequest["generateFields"], [gen])

  const parseMaybeJSON = (text?: string) => {
    if (!text) return null
    const stripped = text.trim().replace(/^```(?:json)?/i, "").replace(/```\s*$/i, "").trim()
    try { return JSON.parse(stripped) } catch { return null }
  }

  const normalizePersonaData = (raw: any) => {
    if (raw == null) return null
    let obj: any = raw

    // Case: the entire payload is a JSON string
    if (typeof obj === "string") {
      const parsed = parseMaybeJSON(obj)
      if (parsed && typeof parsed === "object") obj = parsed
    }

    // Case: top-level array
    if (Array.isArray(obj)) obj = obj[0]

    // Case: LLM returns object with nested content.parts[0].text containing JSON string
    const maybeText = obj?.content?.parts?.[0]?.text
    if (typeof maybeText === "string") {
      const parsed = parseMaybeJSON(maybeText)
      if (parsed && typeof parsed === "object") obj = parsed
    }

    // Common wrappers from n8n or custom flows
    if (obj && typeof obj === "object") {
      if (obj.output && typeof obj.output === "object") obj = obj.output
      else if (obj.data && typeof obj.data === "object") obj = obj.data
      else if (obj.result && typeof obj.result === "object") obj = obj.result
    }

    return obj && typeof obj === "object" ? obj : null
  }

  const toStringVal = (v: any) => {
    if (v == null) return undefined
    if (typeof v === "string") return v
    try { return JSON.stringify(v) } catch { return String(v) }
  }

  const normalizePersonaList = (raw: any): any[] | null => {
    // Accept: array of persona objects, or object with options/choices, or single object
    if (!raw) return null
    let r = raw
    if (typeof r === "string") {
      const parsed = parseMaybeJSON(r)
      if (parsed) r = parsed
    }
    // Unwrap common wrappers
    if (r && typeof r === "object") {
      if (Array.isArray(r)) {
        const normalized = r.map(x => normalizePersonaData(x)).filter(Boolean) as any[]
        // If any normalized item contains nested options/choices/etc, expand them
        const flattened: any[] = []
        for (const item of normalized) {
          if (item && typeof item === "object") {
            const nested = (item.options || item.choices || item.suggestions || item.results) as any[] | undefined
            if (Array.isArray(nested)) {
              flattened.push(...nested.map(n => normalizePersonaData(n)).filter(Boolean) as any[])
              continue
            }
          }
          flattened.push(item)
        }
        return flattened
      }
      const candidates = (r.options || r.choices || r.suggestions || r.results) as any[] | undefined
      if (Array.isArray(candidates)) return candidates.map(x => normalizePersonaData(x)).filter(Boolean) as any[]
      const single = normalizePersonaData(r)
      if (!single) return null
      // IMPORTANT: If the normalized single object itself contains options/choices/etc, expand them
      const nested = (single.options || single.choices || single.suggestions || single.results) as any[] | undefined
      if (Array.isArray(nested)) return nested.map(x => normalizePersonaData(x)).filter(Boolean) as any[]
      return single ? [single] : null
    }
    return null
  }

  const applyPersona = (data: any) => {
    generateFields?.forEach((field) => {
      const val = (data as any)[field]
      const s = toStringVal(val)
      if (typeof s === "string") {
        switch (field) {
          case "personaName": setPersonaName(s); break
          case "background": setBackground(s); break
          case "demographics": setDemographics(s); break
          case "psychographics": setPsychographics(s); break
          case "painPoints": setPainPoints(s); break
          case "mindset": setMindset(s); break
          case "quote": setQuote(s); break
        }
      }
    })
  }

  const onGenerate = async () => {
    if (!selectedProduct) return
    if (!generateFields || generateFields.length === 0) {
      toast({ title: "Select fields to generate", description: "Pick at least one trait to AI-generate.", variant: "destructive" })
      return
    }
    setLoading(true)
    setOptions(null)
    try {
      const req: PersonaGenerateRequest = {
        product: { name: selectedProduct.name, description: selectedProduct.description },
        traits: { personaName: personaName || undefined, background: background || undefined, demographics: demographics || undefined, psychographics: psychographics || undefined, painPoints: painPoints || undefined, mindset: mindset || undefined, quote: quote || undefined },
        generateFields,
        marketType,
        count: 2,
      }
      const res = await generateBuyerPersona(req)
      console.log("[Persona] webhook status:", res.status, "ok:", res.ok)
      if (res.text) console.log("[Persona] raw text:", res.text)
      const raw = (res.json as any) || parseMaybeJSON(res.text)
      console.log("[Persona] raw json:", raw)
      // Extra diagnostics
      const diagParsedFromText = res.text ? parseMaybeJSON(res.text) : null
      if (diagParsedFromText) console.log("[Persona] parsed from text:", diagParsedFromText)
      let data = normalizePersonaData(raw)
      console.log("[Persona] normalizePersonaData(raw):", data)
      if (!data && res.text) {
        // Final fallback: extract last JSON object/array from text
        const m = res.text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
        if (m) {
          const extracted = parseMaybeJSON(m[0])
          data = normalizePersonaData(extracted)
          console.log("[Persona] extracted JSON then normalized:", data)
        }
      }
      let list = normalizePersonaList(raw) || (data ? [data] : null)
      console.log("[Persona] normalizePersonaList(raw):", list)
      if (!list || list.length === 0) {
        // Fallback: parse res.text if it's an array of wrappers each with content.parts[0].text containing JSON
        const tParsed = res.text ? parseMaybeJSON(res.text) : null
        if (Array.isArray(tParsed)) {
          const collected: any[] = []
          for (const entry of tParsed) {
            const innerText = entry?.content?.parts?.[0]?.text
            const innerObj = parseMaybeJSON(innerText)
            if (innerObj && typeof innerObj === 'object') {
              const nested = (innerObj.options || innerObj.choices || innerObj.suggestions || innerObj.results) as any[] | undefined
              if (Array.isArray(nested)) {
                collected.push(...nested.map(n => normalizePersonaData(n)).filter(Boolean) as any[])
              } else {
                const single = normalizePersonaData(innerObj)
                if (single) collected.push(single)
              }
            }
          }
          if (collected.length > 0) {
            list = collected
          }
        }
      }
      if (!list || list.length === 0) {
        console.log("[Persona] raw type:", typeof raw, "text len:", res.text?.length)
        if (typeof raw === "object" && raw) console.log("[Persona] raw keys:", Object.keys(raw))
        toast({ title: "Invalid AI output", description: "Response was not a JSON object/array with persona fields.", variant: "destructive" })
        return
      }
      // Keep only first two options
      list = list.slice(0, 2)
      console.log("[Persona] parsed options:", list)
      if (list[0]) console.log("[Persona] option[0] keys:", Object.keys(list[0]))
      if (list[1]) console.log("[Persona] option[1] keys:", Object.keys(list[1]))
      setOptions(list)
      // Prepare editable copies
      try {
        const deep = JSON.parse(JSON.stringify(list))
        setEdited(deep)
      } catch {
        setEdited(list.map(x => ({ ...x })))
      }
      setEditMode({})
      // Do not auto-apply; user will pick one
      toast({ title: "Personas generated", description: `Received ${list.length} option(s). Choose one to apply.` })
    } finally { setLoading(false) }
  }

  const onSave = () => {
    setDraft({ personaName, background, demographics: demographics || undefined, psychographics: psychographics || undefined, painPoints, mindset, quote: quote || undefined })
    toast({ title: "Saved", description: "Buyer persona saved to draft." })
    router.push("/train/setup")
  }

  const onContinueToReview = () => {
    setDraft({ personaName, background, demographics: demographics || undefined, psychographics: psychographics || undefined, painPoints, mindset, quote: quote || undefined })
    router.push(REVIEW_ROUTE)
  }

  const handleToggleEdit = (idx: number) => setEditMode(m => ({ ...m, [idx]: !m[idx] }))
  const handleEditedChange = (idx: number, key: string, val: string) => {
    setEdited(prev => {
      if (!prev) return prev
      const next = [...prev]
      next[idx] = { ...next[idx], [key]: val }
      return next
    })
  }
  const handleUse = (idx: number) => {
    const picked = (edited && edited[idx]) ? edited[idx] : options?.[idx]
    if (picked) {
      // Persist to draft so the review/setup page can read it
      setDraft({
        personaName: toStringVal(picked.personaName) || "",
        background: toStringVal(picked.background) || "",
        demographics: toStringVal(picked.demographics) || undefined,
        psychographics: toStringVal(picked.psychographics) || undefined,
        painPoints: toStringVal(picked.painPoints) || "",
        mindset: toStringVal(picked.mindset) || "",
        quote: toStringVal(picked.quote) || undefined,
      })
      applyPersona(picked)
      toast({ title: "Applied", description: `Option ${idx + 1} applied to selected fields.` })
      router.push(REVIEW_ROUTE)
    }
  }

  const renderBulletList = (text?: string, emoji?: string) => {
    if (!text) return null
    const s = toStringVal(text) || ""
    const parts = s
      .split(/\n+|\s*\u2022\s*|(?<=\.)\s+/) // split by newlines, bullets, or sentences
      .map(t => t.trim())
      .filter(Boolean)
    if (parts.length === 0) return null
    return (
      <ul className="list-disc pl-5 space-y-1">
        {parts.map((p, i) => (
          <li key={i}><span className="mr-1">{emoji || "•"}</span>{p}</li>
        ))}
      </ul>
    )
  }

  const showForm = !options || options.length === 0

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
      <div className="text-sm text-muted-foreground">Product: {selectedProduct?.name}</div>
      <Card className="rounded-xl shadow-sm border">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-xl">Buyer Persona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {showForm && (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm mb-1 font-medium">Persona Name</div>
                  <Input className="rounded-lg" value={personaName} onChange={(e) => setPersonaName(e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <div className="text-sm mb-1 font-medium">Background</div>
                  <Textarea className="rounded-lg" rows={3} value={background} onChange={(e) => setBackground(e.target.value)} placeholder="role, industry, stage, experience" />
                </div>
                <div>
                  <div className="text-sm mb-1 font-medium">Demographics (optional)</div>
                  <Textarea className="rounded-lg" rows={3} value={demographics} onChange={(e) => setDemographics(e.target.value)} placeholder="age, gender, location, education, income" />
                </div>
                <div>
                  <div className="text-sm mb-1 font-medium">Psychographics (optional)</div>
                  <Textarea className="rounded-lg" rows={3} value={psychographics} onChange={(e) => setPsychographics(e.target.value)} placeholder="values, traits, interests, lifestyle" />
                </div>
                <div>
                  <div className="text-sm mb-1 font-medium">Key Pain Points</div>
                  <Textarea className="rounded-lg" rows={3} value={painPoints} onChange={(e) => setPainPoints(e.target.value)} placeholder="specific problems" />
                </div>
                <div>
                  <div className="text-sm mb-1 font-medium">Current Mindset</div>
                  <Textarea className="rounded-lg" rows={3} value={mindset} onChange={(e) => setMindset(e.target.value)} placeholder="attitudes to solutions and buying" />
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm mb-1 font-medium">Representative Quote</div>
                  <Input className="rounded-lg" value={quote} onChange={(e) => setQuote(e.target.value)} placeholder='"We need tools that scale without complexity"' />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3 text-sm">
                {(["personaName","background","demographics","psychographics","painPoints","mindset","quote"] as const).map((k) => (
                  <label key={k} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors">
                    <Checkbox checked={!!gen[k]} onCheckedChange={(v) => setGen((s) => ({ ...s, [k]: !!v }))} />
                    Generate {k}
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm">Market:</div>
                <select
                  value={marketType}
                  onChange={(e) => setMarketType(e.target.value as any)}
                  className="border rounded-lg px-3 py-2 text-sm bg-background hover:bg-accent/20 transition-colors"
                >
                  <option value="B2C">B2C</option>
                  <option value="B2B">B2B</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={onGenerate} disabled={loading} className="rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} AI Generate (2 options)
                </Button>
                <Button variant="outline" onClick={onSave} className="rounded-lg">Save & Back</Button>
                <Button variant="default" onClick={onContinueToReview} className="rounded-lg" disabled={!personaName || !background}>Continue</Button>
              </div>
            </>
          )}

          {!showForm && options && options.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Choose a persona</h3>
                  <p className="text-sm text-muted-foreground">Two AI-generated options are ready. Pick one to apply.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setOptions(null)} className="rounded-lg">Edit manually</Button>
                  <Button onClick={onGenerate} disabled={loading} className="rounded-lg">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Regenerate
                  </Button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {(edited || options)?.map((opt, idx) => {
                  const e = edited?.[idx] || opt
                  const isEditing = !!editMode[idx]
                  return (
                    <Card key={idx} className="border rounded-xl hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Option {idx + 1}: {e.personaName || "(no name)"}</CardTitle>
                        <Button size="sm" variant="ghost" onClick={() => handleToggleEdit(idx)}>{isEditing ? "Preview" : "Edit"}</Button>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        {!isEditing && (
                          <div className="space-y-3">
                            {e.background && (
                              <div>
                                <div className="font-medium">🧩 Background</div>
                                {renderBulletList(toStringVal(e.background), "📌")}
                              </div>
                            )}
                            {e.demographics && (
                              <div>
                                <div className="font-medium">🌍 Demographics</div>
                                {renderBulletList(toStringVal(e.demographics), "👥")}
                              </div>
                            )}
                            {e.psychographics && (
                              <div>
                                <div className="font-medium">🧠 Psychographics</div>
                                {renderBulletList(toStringVal(e.psychographics), "✨")}
                              </div>
                            )}
                            {e.painPoints && (
                              <div>
                                <div className="font-medium">⚠️ Pain Points</div>
                                {renderBulletList(toStringVal(e.painPoints), "❗")}
                              </div>
                            )}
                            {e.mindset && (
                              <div>
                                <div className="font-medium">💭 Mindset</div>
                                {renderBulletList(toStringVal(e.mindset), "💡")}
                              </div>
                            )}
                            {e.quote && (
                              <div>
                                <div className="font-medium">💬 Quote</div>
                                <div className="italic opacity-90">“{toStringVal(e.quote)}”</div>
                              </div>
                            )}
                            {!e.background && !e.demographics && !e.psychographics && !e.painPoints && !e.mindset && !e.quote && (
                              <div className="text-muted-foreground">
                                <div className="text-xs">No recognizable fields parsed. Raw:</div>
                                <pre className="text-xs bg-muted/50 rounded p-2 overflow-auto max-h-32">{toStringVal(e)}</pre>
                              </div>
                            )}
                          </div>
                        )}

                        {isEditing && (
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <div className="text-xs mb-1 font-medium">🧑‍💼 Persona Name</div>
                              <Input value={e.personaName || ""} onChange={(ev) => handleEditedChange(idx, "personaName", ev.target.value)} />
                            </div>
                            <div>
                              <div className="text-xs mb-1 font-medium">🧩 Background</div>
                              <Textarea rows={3} value={toStringVal(e.background) || ""} onChange={(ev) => handleEditedChange(idx, "background", ev.target.value)} />
                            </div>
                            <div>
                              <div className="text-xs mb-1 font-medium">🌍 Demographics</div>
                              <Textarea rows={3} value={toStringVal(e.demographics) || ""} onChange={(ev) => handleEditedChange(idx, "demographics", ev.target.value)} />
                            </div>
                            <div>
                              <div className="text-xs mb-1 font-medium">🧠 Psychographics</div>
                              <Textarea rows={3} value={toStringVal(e.psychographics) || ""} onChange={(ev) => handleEditedChange(idx, "psychographics", ev.target.value)} />
                            </div>
                            <div>
                              <div className="text-xs mb-1 font-medium">⚠️ Pain Points</div>
                              <Textarea rows={3} value={toStringVal(e.painPoints) || ""} onChange={(ev) => handleEditedChange(idx, "painPoints", ev.target.value)} />
                            </div>
                            <div>
                              <div className="text-xs mb-1 font-medium">💭 Mindset</div>
                              <Textarea rows={3} value={toStringVal(e.mindset) || ""} onChange={(ev) => handleEditedChange(idx, "mindset", ev.target.value)} />
                            </div>
                            <div>
                              <div className="text-xs mb-1 font-medium">💬 Quote</div>
                              <Input value={toStringVal(e.quote) || ""} onChange={(ev) => handleEditedChange(idx, "quote", ev.target.value)} />
                            </div>
                          </div>
                        )}

                        <div className="pt-2 flex items-center gap-2">
                          <Button size="sm" className="rounded-md" onClick={() => handleUse(idx)}>Use this</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
