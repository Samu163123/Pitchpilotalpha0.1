import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Target, Zap, Package } from "lucide-react"
import type { Product, Persona, Difficulty } from "@/lib/types"
import { PERSONAS, DIFFICULTIES } from "@/lib/data"

interface PreCallBriefProps {
  product: Product
  persona: Persona
  difficulty: Difficulty
}

export function PreCallBrief({ product, persona, difficulty }: PreCallBriefProps) {
  const personaData = PERSONAS[persona]
  const difficultyData = DIFFICULTIES[difficulty]

  return (
    <div className="space-y-6">
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
          <CardContent>
            <h3 className="font-semibold mb-2">{product.name}</h3>
            <p className="text-muted-foreground text-sm">{product.description}</p>
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
              <span className="text-sm font-medium">Buyer Persona:</span>
              <Badge variant="secondary">{personaData.name}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Difficulty:</span>
              <Badge variant="outline">{difficultyData.name}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score Multiplier:</span>
              <Badge>{difficultyData.multiplier}x</Badge>
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
          <div>
            <h4 className="font-semibold mb-2 flex items-center">
              <span className="text-lg mr-2">{personaData.icon}</span>
              Background
            </h4>
            <p className="text-muted-foreground">{personaData.background}</p>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-2">Key Pain Points</h4>
            <ul className="space-y-1">
              {personaData.pains.map((pain, index) => (
                <li key={index} className="text-muted-foreground text-sm flex items-start">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0" />
                  {pain}
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-2">Current Mindset</h4>
            <p className="text-muted-foreground">{personaData.mindset}</p>
          </div>
        </CardContent>
      </Card>

      {/* Call Tips */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Quick Tips for Success</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="text-sm flex items-start">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
              Start with discovery questions to understand their specific needs
            </li>
            <li className="text-sm flex items-start">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
              Listen actively and acknowledge their pain points before pitching
            </li>
            <li className="text-sm flex items-start">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
              Use specific examples and social proof to build credibility
            </li>
            <li className="text-sm flex items-start">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
              Handle objections with empathy using "Feel, Felt, Found"
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
