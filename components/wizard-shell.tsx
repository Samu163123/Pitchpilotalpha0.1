"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"

interface Step {
  id: number
  name: string
  description: string
}

interface WizardShellProps {
  steps: Step[]
  currentStep: number
  onNext: () => void
  onBack: () => void
  canProceed: boolean
  nextLabel?: string
  children: React.ReactNode
}

export function WizardShell({
  steps,
  currentStep,
  onNext,
  onBack,
  canProceed,
  nextLabel = "Next",
  children,
}: WizardShellProps) {
  const progress = (currentStep / steps.length) * 100
  const currentStepData = steps.find((step) => step.id === currentStep)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Training Setup
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Configure your perfect training scenario</p>
          </div>
          <div className="text-sm font-medium px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
            Step {currentStep} of {steps.length}
          </div>
        </div>

        <div className="mb-6">
          <Progress value={progress} className="h-2 bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="flex justify-between">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex flex-col items-center transition-all duration-300 ${
                step.id === currentStep
                  ? "text-blue-600 dark:text-blue-400 font-medium scale-105"
                  : step.id < currentStep
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400 dark:text-gray-600"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm mb-2 transition-all duration-300 ${
                  step.id === currentStep
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg animate-glow"
                    : step.id < currentStep
                      ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {step.id < currentStep ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <span className="hidden sm:block text-xs text-center max-w-20">{step.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-8 shadow-modern border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm animate-scale-in">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl text-gray-900 dark:text-white">{currentStepData?.name}</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">{currentStepData?.description}</p>
        </CardHeader>
        <CardContent className="pt-0">{children}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={currentStep === 1}
          className="px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/80"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
