"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, User, Briefcase, Target, Brain, MessageSquare, DollarSign, MapPin, GraduationCap, Info, ChevronRight, Sparkles, Check } from 'lucide-react'
import { useSetupSelectionStore } from "@/lib/store"
import { useBuyerPersonaDraftStore } from "@/lib/store"
import { PersonaGenerateRequest, generateBuyerPersona } from "@/lib/webhook"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const REVIEW_ROUTE = "/train/review" // TODO: adjust if your review page path differs

function PersonaPreviewCard({ personaName, background, demographics, psychographics, painPoints, mindset, quote, marketType }) {
  const renderList = (text, icon) => {
    if (!text) return null
    const items = text.split(/\n|,/g).map(s => s.trim()).filter(Boolean)
    if (items.length === 0) return null
    return (
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            {icon}
            <span className="flex-1">{item}</span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <Card className="rounded-2xl shadow-modern bg-gradient-to-br from-secondary/30 via-background to-background sticky top-24">
      <CardHeader className="pb-4">
        <CardTitle className="gradient-text text-2xl">{(personaName || 'Persona Name')}</CardTitle>
        <CardDescription>{background || 'Background summary...'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        {quote && (
          <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
            <p>"{quote}"</p>
          </blockquote>
        )}
        <div className="space-y-4">
          {demographics && <div><h4 className="font-semibold mb-2 flex items-center gap-2"><User className="w-4 h-4 text-primary"/>Demographics</h4>{renderList(demographics, <MapPin className="w-3.5 h-3.5 mt-1 text-muted-foreground" />)}</div>}
          {psychographics && <div><h4 className="font-semibold mb-2 flex items-center gap-2"><Brain className="w-4 h-4 text-primary"/>Psychographics</h4>{renderList(psychographics, <Check className="w-3.5 h-3.5 mt-1 text-muted-foreground" />)}</div>}
          {painPoints && <div><h4 className="font-semibold mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-primary"/>Pain Points</h4>{renderList(painPoints, <ChevronRight className="w-3.5 h-3.5 mt-1 text-muted-foreground" />)}</div>}
          {mindset && <div><h4 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary"/>Mindset</h4>{renderList(mindset, <Info className="w-3.5 h-3.5 mt-1 text-muted-foreground" />)}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

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
  // All fields checked by default for AI generation
  const [gen, setGen] = useState<Record<string, boolean>>({ personaName: true, background: true, demographics: true, psychographics: true, painPoints: true, mindset: true, quote: true })
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
    setEdited(null)

    try {
      const generateFields = Object.keys(gen).filter(k => gen[k]) as Array<keyof PersonaGenerateRequest['traits']>

      const req: PersonaGenerateRequest = {
        product: { name: selectedProduct.name, description: selectedProduct.description },
        traits: { personaName, background, demographics, psychographics, painPoints, mindset, quote },
        generateFields,
        marketType,
        count: 3,
      }

      const result = await generateBuyerPersona(req)

      if (result.ok && result.json) {
        const { personas } = result.json
        console.log("[Persona] parsed options:", personas)
        if (personas[0]) console.log("[Persona] option[0] keys:", Object.keys(personas[0]))
        if (personas[1]) console.log("[Persona] option[1] keys:", Object.keys(personas[1]))
        setOptions(personas)
        // Prepare editable copies
        try {
          const deep = JSON.parse(JSON.stringify(personas))
          setEdited(deep)
        } catch {
          setEdited(personas.map(x => ({ ...x })))
        }
        setEditMode({})
        // Do not auto-apply; user will pick one
        toast({ title: "Personas generated", description: `Received ${personas.length} option(s). Choose one to apply.` })
      } else {
        console.log("[Persona] raw type:", typeof result, "text len:", result.text?.length)
        if (typeof result === "object" && result) console.log("[Persona] raw keys:", Object.keys(result))
        toast({ title: "Invalid AI output", description: "Response was not a JSON object/array with persona fields.", variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
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
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-2 text-xs md:text-sm">
        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">Product</span>
        <span className="text-muted-foreground">{selectedProduct?.name}</span>
      </div>
      
      {showForm ? (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-6">
            <Card className="rounded-2xl border shadow-modern">
              <CardHeader className="pb-4 border-b bg-gradient-to-r from-primary/5 via-secondary/10 to-primary/5 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl gradient-text">Create Buyer Persona</CardTitle>
                  <span className="hidden md:inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                    Tailor your ideal customer
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="group/field rounded-xl border p-3 transition-colors hover:bg-secondary/30 focus-within:bg-secondary/40 focus-within:ring-2 focus-within:ring-primary/30">
                    <div className="text-sm mb-1 font-medium text-primary flex items-center gap-2"><User className="w-4 h-4"/>Persona Name</div>
                    <Input className="rounded-lg bg-transparent" value={personaName} onChange={(e) => setPersonaName(e.target.value)} placeholder="e.g. Marketing Manager Mary" />
                  </div>
                  <div className="group/field rounded-xl border p-3 transition-colors hover:bg-secondary/30 focus-within:bg-secondary/40 focus-within:ring-2 focus-within:ring-primary/30">
                    <div className="text-sm mb-1 font-medium text-primary flex items-center gap-2"><Briefcase className="w-4 h-4"/>Background</div>
                    <Textarea className="rounded-lg bg-transparent" rows={3} value={background} onChange={(e) => setBackground(e.target.value)} placeholder="Role, industry, company size..." />
                  </div>
                  <div className="group/field rounded-xl border p-3 transition-colors hover:bg-secondary/30 focus-within:bg-secondary/40 focus-within:ring-2 focus-within:ring-primary/30">
                    <div className="text-sm mb-1 font-medium text-primary flex items-center gap-2"><Info className="w-4 h-4"/>Demographics</div>
                    <Textarea className="rounded-lg bg-transparent" rows={3} value={demographics} onChange={(e) => setDemographics(e.target.value)} placeholder="Age, gender, location, education..." />
                  </div>
                  <div className="group/field rounded-xl border p-3 transition-colors hover:bg-secondary/30 focus-within:bg-secondary/40 focus-within:ring-2 focus-within:ring-primary/30">
                    <div className="text-sm mb-1 font-medium text-primary flex items-center gap-2"><Brain className="w-4 h-4"/>Psychographics</div>
                    <Textarea className="rounded-lg bg-transparent" rows={3} value={psychographics} onChange={(e) => setPsychographics(e.target.value)} placeholder="Values, interests, lifestyle..." />
                  </div>
                  <div className="group/field rounded-xl border p-3 transition-colors hover:bg-secondary/30 focus-within:bg-secondary/40 focus-within:ring-2 focus-within:ring-primary/30">
                    <div className="text-sm mb-1 font-medium text-primary flex items-center gap-2"><Target className="w-4 h-4"/>Key Pain Points</div>
                    <Textarea className="rounded-lg bg-transparent" rows={3} value={painPoints} onChange={(e) => setPainPoints(e.target.value)} placeholder="Specific problems, challenges..." />
                  </div>
                  <div className="group/field rounded-xl border p-3 transition-colors hover:bg-secondary/30 focus-within:bg-secondary/40 focus-within:ring-2 focus-within:ring-primary/30">
                    <div className="text-sm mb-1 font-medium text-primary flex items-center gap-2"><Sparkles className="w-4 h-4"/>Current Mindset</div>
                    <Textarea className="rounded-lg bg-transparent" rows={3} value={mindset} onChange={(e) => setMindset(e.target.value)} placeholder="Attitudes towards solutions, buying triggers..." />
                  </div>
                  <div className="md:col-span-2 group/field rounded-xl border p-3 transition-colors hover:bg-secondary/30 focus-within:bg-secondary/40 focus-within:ring-2 focus-within:ring-primary/30">
                    <div className="text-sm mb-1 font-medium text-primary flex items-center gap-2"><MessageSquare className="w-4 h-4"/>Representative Quote</div>
                    <Input className="rounded-lg bg-transparent" value={quote} onChange={(e) => setQuote(e.target.value)} placeholder='"We need tools that scale without complexity."' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border shadow-modern">
              <CardHeader>
                <CardTitle className="text-xl gradient-text flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary"/>AI Generation</CardTitle>
                <CardDescription>Select which fields you want the AI to help you with.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  {( ["personaName","background","demographics","psychographics","painPoints","mindset","quote"] as const).map((k) => (
                    <label key={k} className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/30 transition-colors">
                      <Checkbox checked={!!gen[k]} onCheckedChange={(v) => setGen((s) => ({ ...s, [k]: !!v }))} />
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center gap-3 p-4 bg-background/50 backdrop-blur-sm rounded-2xl border sticky bottom-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm font-medium">Market:</div>
                <select
                  value={marketType}
                  onChange={(e) => setMarketType(e.target.value as any)}
                  className="border rounded-lg px-3 py-2 text-sm bg-background hover:bg-accent/40 transition-colors"
                >
                  <option value="B2C">B2C</option>
                  <option value="B2B">B2B</option>
                </select>
              </div>
              <div className="flex-grow" />
              <div className="flex flex-wrap gap-3">
                <Button onClick={onGenerate} disabled={loading} className="rounded-lg shadow-sm hover:shadow-md transition-shadow bg-gradient-to-r from-primary to-secondary">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} AI Generate (2 options)
                </Button>
                <Button variant="outline" onClick={onSave} className="rounded-lg">Save & Back</Button>
                <Button variant="default" onClick={onContinueToReview} className="rounded-lg" disabled={!personaName || !background}>Continue</Button>
              </div>
            </div>

          </div>
          <div className="md:col-span-1">
            <PersonaPreviewCard {...{ personaName, background, demographics, psychographics, painPoints, mindset, quote, marketType }} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Choose a persona</h3>
              <p className="text-sm text-muted-foreground">Two AI-generated options are ready. Pick one to apply.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOptions(null)} className="rounded-lg">Edit manually</Button>
              <Button onClick={onGenerate} disabled={loading} className="rounded-lg bg-gradient-to-r from-primary to-secondary">
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
                <div key={idx}>
                  <h3 className="text-lg font-semibold mb-2 text-center">Option {idx + 1}</h3>
                  <PersonaPreviewCard 
                    personaName={e.personaName}
                    background={e.background}
                    demographics={e.demographics}
                    psychographics={e.psychographics}
                    painPoints={e.painPoints}
                    mindset={e.mindset}
                    quote={e.quote}
                    marketType={marketType}
                  />
                  <div className="mt-4 flex justify-center">
                     <Button onClick={() => handleUse(idx)} className="w-full bg-gradient-to-r from-primary to-secondary">Apply this persona</Button>
                  </div>
                  <div className="mt-2 flex justify-center">
                    <Link href="/train/chat" className="w-full">
                      <Button variant="outline" className="w-full">Start Chat</Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
