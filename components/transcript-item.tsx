import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { TranscriptSegment } from "@/lib/types"

interface TranscriptItemProps {
  segment: TranscriptSegment
}

export function TranscriptItem({ segment }: TranscriptItemProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const isUser = segment.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"} items-start space-x-3`}>
        {/* Avatar */}
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="text-xs">{isUser ? "You" : "🤖"}</AvatarFallback>
        </Avatar>

        {/* Message Content */}
        <div className={`${isUser ? "mr-3" : "ml-3"}`}>
          {/* Header */}
          <div className={`flex items-center space-x-2 mb-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            <Badge variant={isUser ? "default" : "secondary"} className="text-xs">
              {isUser ? "You" : "Buyer"}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatTime(segment.timestamp)}</span>
          </div>

          {/* Message Bubble */}
          <div className={`rounded-lg px-4 py-2 ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            <p className="text-sm whitespace-pre-wrap">{segment.text}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
