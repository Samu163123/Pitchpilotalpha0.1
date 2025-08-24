"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { LevelProgress } from "@/components/level-progress"
import { PointsBadge } from "@/components/points-badge"
import { AudioDeviceSelector } from "@/components/audio-device-selector"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { User, Settings, Trash2, Award, Mic, Volume2 } from "lucide-react"
import { useProfileStore, useHistoryStore, useScenarioStore, useCallStore } from "@/lib/store"
import { useTheme } from "next-themes"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { points, level, streak, audioDevice, voiceSpeed, setAudioDevice, setVoiceSpeed } = useProfileStore()
  const { sessions, clearAll: clearHistory } = useHistoryStore()
  const { clearScenario } = useScenarioStore()
  const { clearCall } = useCallStore()

  const [showClearDialog, setShowClearDialog] = useState(false)

  const pointsToNextLevel = level * 1000 - (points % 1000)
  const progressToNextLevel = ((points % 1000) / 1000) * 100

  const totalSessions = sessions.length
  const winRate =
    totalSessions > 0 ? (sessions.filter((s) => s.feedback.outcome === "win").length / totalSessions) * 100 : 0
  const avgScore = totalSessions > 0 ? sessions.reduce((sum, s) => sum + s.feedback.score, 0) / totalSessions : 0

  const handleClearAllData = () => {
    clearHistory()
    clearScenario()
    clearCall()
    localStorage.clear()

    toast({
      title: "Data cleared",
      description: "All your training data has been cleared successfully.",
    })

    setShowClearDialog(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
        <p className="text-muted-foreground">Track your progress and customize your training experience</p>
      </div>

      <div className="grid gap-6">
        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <LevelProgress
                  level={level}
                  points={points}
                  pointsToNext={pointsToNextLevel}
                  progress={progressToNextLevel}
                />

                <div className="flex items-center justify-between">
                  <PointsBadge points={points} />
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <span>🔥</span>
                    <span>{streak} day streak</span>
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{totalSessions}</div>
                    <div className="text-sm text-muted-foreground">Total Sessions</div>
                  </div>

                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{winRate.toFixed(0)}%</div>
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                  </div>
                </div>

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{avgScore.toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audio Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mic className="w-5 h-5 mr-2" />
              Audio Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Audio Input Device</Label>
              <AudioDeviceSelector selectedDevice={audioDevice} onDeviceSelect={setAudioDevice} />
              <p className="text-sm text-muted-foreground">Choose your preferred microphone for voice training</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4" />
                <span>Voice Speed</span>
              </Label>
              <Select value={voiceSpeed.toString()} onValueChange={(value) => setVoiceSpeed(Number.parseFloat(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.75">0.75x (Slower)</SelectItem>
                  <SelectItem value="1.0">1.0x (Normal)</SelectItem>
                  <SelectItem value="1.25">1.25x (Faster)</SelectItem>
                  <SelectItem value="1.5">1.5x (Much Faster)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">Adjust the playback speed for AI buyer responses</p>
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              App Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
              </div>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <Trash2 className="w-5 h-5 mr-2" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Clear All Data</h4>
              <p className="text-sm text-muted-foreground mb-4">
                This will permanently delete all your training history, progress, and settings. This action cannot be
                undone.
              </p>
              <Button variant="destructive" onClick={() => setShowClearDialog(true)} className="w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Clear All Data"
        description="Are you sure you want to delete all your training data? This includes your history, progress, and settings. This action cannot be undone."
        confirmText="Clear All Data"
        onConfirm={handleClearAllData}
        variant="destructive"
      />
    </div>
  )
}
