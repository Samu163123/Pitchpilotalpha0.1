"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { WizardShell } from "@/components/wizard-shell"
import { Slider } from "@/components/ui/slider"
import { ProductSelector } from "@/components/product-selector"
import { PersonaSelector } from "@/components/persona-selector"
import { DifficultySelector } from "@/components/difficulty-selector"
import { PreCallBrief } from "@/components/pre-call-brief"
import { useScenarioStore, useCallStore } from "@/lib/store"
import { useSetupSelectionStore } from "@/lib/store"
import { sendScenarioToWebhook } from "@/lib/webhook"
import type { Product, Persona, Difficulty } from "@/lib/types"
import { DEFAULT_PRODUCTS, PERSONAS, DIFFICULTIES } from "@/lib/data"

const STEPS = [
  { id: 1, name: "Product", description: "Choose what you're selling" },
  { id: 2, name: "Buyer Persona", description: "Select your buyer type" },
  { id: 3, name: "Difficulty", description: "Set challenge level" },
  { id: 4, name: "Brief", description: "Review scenario details" },
]

export default function TrainingSetup() {
  const router = useRouter()
  const { setScenario } = useScenarioStore()
  const { setSessionId, setInitialBuyerMessage } = useCallStore()
  const { setSelectedProduct } = useSetupSelectionStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [product, setProduct] = useState<Product | null>(null)
  const [persona, setPersona] = useState<Persona | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [timeLimitMin, setTimeLimitMin] = useState<number>(0) // 0 = Unlimited, 1-60 minutes

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return product !== null
      case 2:
        return persona !== null
      case 3:
        return difficulty !== null // time limit optional
      case 4:
        return product !== null && persona !== null && difficulty !== null
      default:
        return false
    }
  }, [currentStep, product, persona, difficulty])

  const handleProductSelect = (p: Product) => {
    setProduct(p)
    // If it's a custom product, route to Buyer Persona page for AI/manual persona creation
    if (p.id.startsWith("custom-")) {
      setSelectedProduct({ id: p.id, name: p.name, description: p.description })
      router.push("/train/persona")
    }
  }

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
      return
    }

    // For the final step, create scenario and start call
    if (!product || !persona || !difficulty) {
      console.error("Missing required scenario data")
      return
    }

    const scenario = {
      product,
      persona,
      difficulty,
      brief: {
        background: PERSONAS[persona].background,
        pains: PERSONAS[persona].pains,
        mindset: PERSONAS[persona].mindset,
      },
      timeLimitSec: timeLimitMin > 0 ? timeLimitMin * 60 : null,
    }
    
    try {
      // Generate session id for this call and persist in store
      const sid = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36)
      setSessionId(sid)

      // Set the scenario in the store first to prevent race conditions
      setScenario(scenario)
      
      // Then send to webhook, including sessionId, and capture AI's first message
      const result = await sendScenarioToWebhook(scenario, sid)
      if (result.ok) {
        const aiMsg =
          (result.json && (result.json["AI output"] || result.json.message || result.json.text || result.json.reply)) ||
          result.text ||
          null
        setInitialBuyerMessage(aiMsg)
        console.log("Scenario data successfully sent to n8n")
      } else {
        setInitialBuyerMessage(null)
        console.warn("Failed to send scenario data to n8n, but continuing with call")
      }
      
      // Navigate to call page
      router.push("/train/call")
    } catch (error) {
      console.error("Error in handleNext:", error)
      // Even if webhook fails, we still want to proceed to the call
      setInitialBuyerMessage(null)
      router.push("/train/call")
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProductSelector 
            selectedProduct={product} 
            onProductSelect={handleProductSelect} 
            products={DEFAULT_PRODUCTS} 
          />
        )
      case 2:
        return (
          <PersonaSelector 
            selectedPersona={persona} 
            onPersonaSelect={setPersona} 
          />
        )
      case 3:
        return (
          <DifficultySelector 
            selectedDifficulty={difficulty} 
            onDifficultySelect={setDifficulty} 
          />
        )
      case 4:
        if (!product || !persona || !difficulty) {
          // This should never happen because canProceed() prevents reaching this step
          return <div>Missing required information. Please go back and fill in all fields.</div>
        }
        return (
          <div className="space-y-6">
            <PreCallBrief 
              product={product} 
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
        nextLabel={currentStep === 4 ? "Start Call" : "Next"}
      >
        {renderStepContent()}
      </WizardShell>
    </div>
  )
}
