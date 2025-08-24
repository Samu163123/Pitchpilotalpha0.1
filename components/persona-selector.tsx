"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Persona } from "@/lib/types"
import { PERSONAS } from "@/lib/data"

interface PersonaSelectorProps {
  selectedPersona: Persona | null
  onPersonaSelect: (persona: Persona) => void
}

export function PersonaSelector({ selectedPersona, onPersonaSelect }: PersonaSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Who are you selling to?</h2>
        <p className="text-muted-foreground">Choose the buyer persona that matches your target customer</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(PERSONAS).map(([key, persona]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedPersona === key ? "ring-2 ring-primary border-primary" : ""
            }`}
            onClick={() => onPersonaSelect(key as Persona)}
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
