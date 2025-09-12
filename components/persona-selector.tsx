"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type PersonaItem = { id: string; name: string; description: string; icon: string; background: string; pains: string[]; mindset: string }

interface PersonaSelectorProps {
  selectedPersona: PersonaItem | null
  onSelect: (persona: PersonaItem) => void
  personas: PersonaItem[]
}

export function PersonaSelector({ selectedPersona, onSelect, personas }: PersonaSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Who are you selling to?</h2>
        <p className="text-muted-foreground">Choose the buyer persona that matches your target customer</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {personas.map((persona) => (
          <Card
            key={persona.id}
            className={`selection-card cursor-pointer transition-all duration-300 shadow-modern border-white ${
              selectedPersona?.id === persona.id ? "selected ring-2 ring-emerald-500 scale-[1.01]" : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:scale-[1.02]"
            }`}
            onClick={() => onSelect(persona)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{persona.icon}</div>
                <div>
                  <CardTitle className="text-lg">{persona.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {persona.name.toLowerCase()}
                  </Badge>
                </div>
                {selectedPersona?.id === persona.id && (
                  <span className="ml-auto inline-flex w-5 h-5 rounded-full bg-emerald-500 items-center justify-center animate-scale-in">
                    <span className="w-2 h-2 bg-white rounded-full" />
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">{persona.description}</p>
              <div className="text-sm">
                <p className="font-medium mb-1">Background:</p>
                <p className="text-muted-foreground text-xs">{persona.background}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
