"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Users, Target, CheckCircle2 } from "lucide-react"
import { CALL_TYPES } from "@/lib/data"
import type { CallType } from "@/lib/types"

interface CallTypeSelectorProps {
  selectedCallType: CallType | null
  onSelect: (callType: CallType) => void
}

const categoryIcons = {
  stage: Phone,
  style: Users, 
  process: Target
}

const categoryLabels = {
  stage: "Sales Stage",
  style: "Call Style",
  process: "Sales Process"
}

const difficultyColors = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800", 
  hard: "bg-red-100 text-red-800"
}

export function CallTypeSelector({ selectedCallType, onSelect }: CallTypeSelectorProps) {
  const [activeTab, setActiveTab] = useState<"stage" | "style" | "process">("stage")

  const callTypesByCategory = {
    stage: CALL_TYPES.filter(ct => ct.category === "stage"),
    style: CALL_TYPES.filter(ct => ct.category === "style"),
    process: CALL_TYPES.filter(ct => ct.category === "process")
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Choose Call Type</h3>
        <p className="text-sm text-muted-foreground">
          Select the type of sales call to practice. Each type has different objectives and buyer behaviors.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {Object.entries(categoryLabels).map(([key, label]) => {
            const Icon = categoryIcons[key as keyof typeof categoryIcons]
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {Object.entries(callTypesByCategory).map(([category, callTypes]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid gap-4">
              {callTypes.map((callType) => (
                <Card 
                  key={callType.id}
                  className={`selection-card cursor-pointer transition-all duration-300 shadow-modern border-white ${
                    selectedCallType?.id === callType.id 
                      ? "selected ring-2 ring-primary scale-[1.01] bg-primary/5" 
                      : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:scale-[1.02]"
                  }`}
                  onClick={() => onSelect(callType)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                            selectedCallType?.id === callType.id
                              ? "bg-gradient-to-br from-primary to-primary/80 shadow-lg animate-scale-in"
                              : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600"
                          }`}
                        >
                          {selectedCallType?.id === callType.id ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : (
                            <Phone className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                          )}
                        </div>
                        <CardTitle className="text-base">
                          {callType.name}
                        </CardTitle>
                      </div>
                      <Badge className={`transition-all duration-300 ${
                        callType.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        callType.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {callType.difficulty}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm mt-2">
                      {callType.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-primary">Goal:</span> {callType.goal}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">AI Behavior:</span> {callType.aiInstructions}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {selectedCallType && (
        <Card className="bg-primary/5 border-primary/20 border-white shadow-modern transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Selected Call Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{selectedCallType.name}</div>
                <div className="text-sm text-muted-foreground">{selectedCallType.goal}</div>
              </div>
              <Badge className={`transition-all duration-300 ${
                selectedCallType.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                selectedCallType.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {selectedCallType.difficulty}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
