"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mic } from "lucide-react"

interface AudioDeviceSelectorProps {
  selectedDevice: string
  onDeviceSelect: (device: string) => void
}

// Mock audio devices for UI demonstration
const MOCK_DEVICES = [
  { id: "default", name: "Default Microphone" },
  { id: "built-in", name: "Built-in Microphone" },
  { id: "usb-headset", name: "USB Headset" },
  { id: "bluetooth", name: "Bluetooth Headphones" },
  { id: "external-mic", name: "External USB Microphone" },
]

export function AudioDeviceSelector({ selectedDevice, onDeviceSelect }: AudioDeviceSelectorProps) {
  return (
    <Select value={selectedDevice} onValueChange={onDeviceSelect}>
      <SelectTrigger>
        <div className="flex items-center space-x-2">
          <Mic className="w-4 h-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {MOCK_DEVICES.map((device) => (
          <SelectItem key={device.id} value={device.id}>
            {device.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
