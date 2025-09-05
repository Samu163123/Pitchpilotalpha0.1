"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { WizardShell } from "@/components/wizard-shell"
import { Slider } from "@/components/ui/slider"
import { ProductSelector } from "@/components/product-selector"
import { PersonaSelector } from "@/components/persona-selector"
import { DifficultySelector } from "@/components/difficulty-selector"
import { CallTypeSelector } from "@/components/call-type-selector"
import { PreCallBrief } from "@/components/pre-call-brief"
import { useScenarioStore, useCallStore } from "@/lib/store"
import { useSetupSelectionStore } from "@/lib/store"
import type { Product, Persona, Difficulty, CallType } from "@/lib/types"
import { DEFAULT_PRODUCTS, PERSONAS, DIFFICULTIES } from "@/lib/data"

const STEPS = [
  { id: 1, name: "Product", description: "Choose what you're selling" },
  { id: 2, name: "Call Type", description: "Select call scenario" },
  { id: 3, name: "Buyer Persona", description: "Select your buyer type" },
  { id: 4, name: "Difficulty", description: "Set challenge level" },
  { id: 5, name: "Brief", description: "Review scenario details" },
]

export default function TrainingSetup() {
  const router = useRouter()
  const { setScenario } = useScenarioStore()
  const { setSessionId, setInitialBuyerMessage } = useCallStore()
  const { setSelectedProduct } = useSetupSelectionStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [product, setProduct] = useState<Product | null>(null)
  const [callType, setCallType] = useState<CallType | null>(null)
  const [persona, setPersona] = useState<Persona | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [timeLimitMin, setTimeLimitMin] = useState<number>(0) // 0 = Unlimited, 1-60 minutes

  console.log('[Setup] Component mounted with selections:', {
    selectedProduct: product?.name,
    selectedCallType: callType?.name,
    selectedPersona: persona?.name,
    selectedDifficulty: difficulty,
    timeLimitMin
  })

  const handleNext = async () => {
    console.log('[Setup] Starting call setup...')
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
      return
    }

    // Final step - create scenario and navigate
    if (!product || !persona || !difficulty) {
      console.error('[Setup] Missing required selections')
      return
    }

    // Build scenario object
    const scenario = {
      product,
      persona: persona.name,
      difficulty,
      callType,
      brief: {
        background: persona.background,
        pains: persona.pains,
        mindset: persona.mindset,
      },
      timeLimitSec: timeLimitMin > 0 ? timeLimitMin * 60 : null,
    }
    
    console.log('[Setup] Built scenario:', scenario)
    
    try {
      // Generate session id for this call and persist in store
      const sid = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36)
      
      console.log('[Setup] Generated session ID:', sid)
      setSessionId(sid)

      // Set the scenario in the store
      setScenario(scenario)
      
      console.log('[Setup] Scenario saved to store, navigating to chat...')
      
      // Navigate directly to chat page (no more n8n dependency)
      router.push("/train/chat")
    } catch (error) {
      console.error('[Setup] Error in handleNext:', error)
      // Still proceed to chat even if there's an error
      router.push("/train/chat")
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!product
      case 2: return true // Call type is optional
      case 3: return !!persona
      case 4: return !!difficulty
      case 5: return !!product && !!persona && !!difficulty
      default: return false
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProductSelector
            products={DEFAULT_PRODUCTS}
            selectedProduct={product}
            onSelect={setProduct}
          />
        )
      case 2:
        return (
          <CallTypeSelector
            selectedCallType={callType}
            onSelect={setCallType}
          />
        )
      case 3:
        return (
          <PersonaSelector
            personas={Object.entries(PERSONAS).map(([key, details]) => ({
              id: key,
              name: details.name,
              description: details.description,
              icon: details.icon,
              background: details.background,
              pains: details.pains,
              mindset: details.mindset
            }))}
            selectedPersona={persona}
            onSelect={setPersona}
          />
        )
      case 4:
        return (
          <DifficultySelector
            difficulties={Object.entries(DIFFICULTIES).map(([key, details]) => ({
              id: key,
              name: details.name,
              description: details.description,
              level: key,
              multiplier: details.multiplier
            }))}
            selectedDifficulty={difficulty}
            onSelect={setDifficulty}
          />
        )
      case 5:
        return (
          <div className="space-y-6">
            <PreCallBrief
              product={product}
              callType={callType}
              persona={persona}
              difficulty={difficulty}
            />
            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Time Limit</h3>
                <span className="text-sm text-muted-foreground">
                  {timeLimitMin === 0 ? "Unlimited" : `${timeLimitMin} min`}
                </span>
              </div>
              <Slider
                min={0}
                max={60}
                step={1}
                value={[timeLimitMin]}
                onValueChange={(v) => setTimeLimitMin(v[0] ?? 0)}
              />
              <p className="text-xs text-muted-foreground mt-2">0 = Unlimited. Range 1–60 minutes.</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <WizardShell
        steps={STEPS}
        currentStep={currentStep}
        onNext={handleNext}
        onBack={handleBack}
        canProceed={canProceed()}
        nextLabel={currentStep === 5 ? "Start Call" : "Next"}
      >
        {renderStepContent()}
      </WizardShell>
    </div>
  )
}
