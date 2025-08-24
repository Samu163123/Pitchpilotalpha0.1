"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { AudioMeter } from "@/components/audio-meter"
import { Mic, MicOff, Send, Phone, Captions } from "lucide-react"
import { useState } from "react"

interface CallControlsProps {
  userInput: string
  setUserInput: (value: string) => void
  onSendMessage: () => void
  onEndCall: () => void
  onKeyPress: (e: React.KeyboardEvent) => void
  isRecording: boolean
  setIsRecording: (recording: boolean) => void
  disabledInput?: boolean
}

export function CallControls({
  userInput,
  setUserInput,
  onSendMessage,
  onEndCall,
  onKeyPress,
  isRecording,
  setIsRecording,
  disabledInput = false,
}: CallControlsProps) {
  const [captionsEnabled, setCaptionsEnabled] = useState(true)
  const [isMuted, setIsMuted] = useState(false)

  const handleMicToggle = () => {
    setIsRecording(!isRecording)
    // TODO: Integrate with real audio recording
    console.log("TODO: Toggle microphone recording")
  }

  return (
    <Card className="m-4 mt-0">
      <CardContent className="p-4">
        {/* Audio Controls */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Button
            variant={isRecording ? "default" : "outline"}
            size="sm"
            onClick={handleMicToggle}
            className="flex items-center space-x-2"
          >
            {isRecording ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span>{isRecording ? "Recording" : "Mic Off"}</span>
          </Button>

          <Button
            variant={captionsEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setCaptionsEnabled(!captionsEnabled)}
            className="flex items-center space-x-2"
          >
            <Captions className="w-4 h-4" />
            <span>Captions</span>
          </Button>

          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="flex items-center space-x-2"
          >
            <span>{isMuted ? "Unmute" : "Mute"}</span>
          </Button>

          {/* Audio Meter */}
          <AudioMeter isActive={isRecording} />
        </div>

        {/* Text Input */}
        <div className="flex space-x-2">
          <Textarea
            placeholder="Type your message or use voice recording..."
            value={userInput}
            onChange={(e) => !disabledInput && setUserInput(e.target.value)}
            onKeyPress={(e) => {
              if (disabledInput) {
                e.preventDefault()
                return
              }
              onKeyPress(e)
            }}
            disabled={disabledInput}
            className={`flex-1 min-h-[60px] resize-none ${disabledInput ? "cursor-not-allowed opacity-60" : ""}`}
            rows={2}
          />
          <div className="flex flex-col space-y-2">
            <Button onClick={onSendMessage} disabled={!userInput.trim() || disabledInput} size="sm">
              <Send className="w-4 h-4" />
            </Button>
            <Button onClick={onEndCall} variant="destructive" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send • Shift+Enter for new line • Click mic to record voice
        </p>
      </CardContent>
    </Card>
  )
}
