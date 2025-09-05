import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Target, Zap, Package, Phone, Clock } from "lucide-react"
import type { Product, Persona, Difficulty, CallType } from "@/lib/types"
import { PERSONAS, DIFFICULTIES } from "@/lib/data"

interface PreCallBriefProps {
  product: Product | null
  callType?: CallType | null
  persona: Persona | null
  difficulty: Difficulty | null
  timeLimitMin?: number
  onTimeLimitChange?: (value: number) => void
}

export function PreCallBrief({ 
  product, 
  callType, 
  persona, 
  difficulty, 
  timeLimitMin = 0, 
  onTimeLimitChange 
}: PreCallBriefProps) {
  if (!product || !persona || !difficulty) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Please complete all previous steps to see the call brief.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Call Brief</h3>
        <p className="text-sm text-muted-foreground">
          Review your sales call scenario before starting.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-muted-foreground">{product.description}</div>
            </div>
          </CardContent>
        </Card>

        {callType && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Call Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{callType.name}</div>
                  <Badge className={
                    callType.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    callType.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {callType.difficulty}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">{callType.description}</div>
                <div className="text-xs">
                  <span className="font-medium text-primary">Goal:</span> {callType.goal}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Buyer Persona
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium">{persona.name}</div>
              <div className="text-sm text-muted-foreground">{persona.background}</div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-primary">Pain Points:</div>
                <div className="text-xs text-muted-foreground">{persona.pains}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Challenge Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{difficulty.name}</div>
                <Badge variant={difficulty.level === 'easy' ? 'secondary' : difficulty.level === 'medium' ? 'default' : 'destructive'}>
                  {difficulty.level}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">{difficulty.description}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {onTimeLimitChange && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Limit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {timeLimitMin === 0 ? "Unlimited" : `${timeLimitMin} minute${timeLimitMin > 1 ? 's' : ''}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {timeLimitMin === 0 ? "Take your time" : "Adds pressure and urgency"}
                </span>
              </div>
              <Slider
                value={[timeLimitMin]}
                onValueChange={(value) => onTimeLimitChange(value[0])}
                max={60}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Unlimited</span>
                <span>60 min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
