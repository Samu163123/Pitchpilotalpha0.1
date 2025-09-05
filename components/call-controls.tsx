"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { AudioMeter } from "@/components/audio-meter"
import { Mic, MicOff, Send, Phone, Captions, Loader2 } from "lucide-react"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"

interface CallControlsProps {
  userInput: string
  setUserInput: (value: string) => void
  onUserEdit?: (value: string) => void
  onSendMessage: () => void
  onEndCall: () => void
  onKeyPress: (e: React.KeyboardEvent) => void
  isRecording: boolean
  setIsRecording: (recording: boolean) => void
  autoSend: boolean
  setAutoSend: (v: boolean) => void
  voskReady: boolean
  disabledInput?: boolean
}

export function CallControls({
  userInput,
  setUserInput,
  onUserEdit,
  onSendMessage,
  onEndCall,
  onKeyPress,
  isRecording,
  setIsRecording,
  autoSend,
  setAutoSend,
  voskReady,
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

          {isRecording && !voskReady && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Loading model…</span>
            </div>
          )}

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

          {/* Auto-send toggle */}
          <div className="flex items-center gap-2 ml-2">
            <Switch id="auto-send" checked={autoSend} onCheckedChange={setAutoSend} />
            <label htmlFor="auto-send" className="text-xs text-muted-foreground select-none">Auto‑send recognized text</label>
          </div>

          {/* Audio Meter */}
          <AudioMeter isActive={isRecording} />
        </div>

        {/* Text Input */}
        <div className="flex space-x-2">
          <Textarea
            placeholder="Type your message or use voice recording..."
            value={userInput}
            onChange={(e) => {
              const v = e.target.value
              if (onUserEdit) onUserEdit(v)
              else setUserInput(v)
            }}
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
