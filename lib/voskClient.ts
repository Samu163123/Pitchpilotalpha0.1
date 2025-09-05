"use client"

// Lightweight wrapper around vosk-browser for use in React components
// Requires hosting a model archive (e.g. public/models/vosk/model.tar.gz)

export type VoskEvents = {
  onPartial?: (text: string) => void
  onResult?: (text: string) => void
  onError?: (err: unknown) => void
  onReady?: () => void
}

export class VoskController {
  private modelUrl: string | string[]
  private events: VoskEvents
  private audioCtx: AudioContext | null = null
  private recognizerNode: ScriptProcessorNode | null = null
  private mediaStream: MediaStream | null = null
  private model: any | null = null
  private recognizer: any | null = null
  private started = false

  constructor(modelUrl: string | string[], events: VoskEvents = {}) {
    this.modelUrl = modelUrl
    this.events = events
  }

  async init() {
    try {
      // Dynamically import to keep server bundles clean
      const Vosk = await import("vosk-browser")
      const urls = Array.isArray(this.modelUrl) ? this.modelUrl : [this.modelUrl]
      let lastErr: unknown = null
      for (const rawUrl of urls) {
        const url = rawUrl.includes("?") ? `${rawUrl}&cb=${Date.now()}` : `${rawUrl}?cb=${Date.now()}`
        try {
          this.model = await (Vosk as any).createModel(url)
          if (this.events.onReady) this.events.onReady()
          return
        } catch (e) {
          lastErr = e
        }
      }
      throw lastErr ?? new Error("Failed to load Vosk model from provided URLs")
    } catch (e) {
      this.events.onError?.(e)
      throw e
    }
  }

  async start() {
    if (this.started) return
    try {
      if (!this.model) await this.init()

      // Set up Web Audio chain
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000,
        } as MediaTrackConstraints,
      })
      this.mediaStream = mediaStream

      // Create recognizer instance
      const sr = this.audioCtx?.sampleRate || 16000
      this.recognizer = new (this.model as any).KaldiRecognizer(sr)
      // Optional: include word timing if needed
      // this.recognizer.setWords(true)

      this.recognizer.on("result", (message: any) => {
        try {
          const text = message?.result?.text || ""
          if (text) this.events.onResult?.(text)
        } catch (err) {
          this.events.onError?.(err)
        }
      })
      this.recognizer.on("partialresult", (message: any) => {
        try {
          const partial = message?.result?.partial || ""
          this.events.onPartial?.(partial)
        } catch (err) {
          this.events.onError?.(err)
        }
      })

      const source = this.audioCtx.createMediaStreamSource(mediaStream)
      // ScriptProcessor is deprecated but supported widely; AudioWorklet would require a worklet processor file
      this.recognizerNode = this.audioCtx.createScriptProcessor(4096, 1, 1)
      this.recognizerNode.onaudioprocess = (event: AudioProcessingEvent) => {
        try {
          // Feed the entire inputBuffer; vosk-browser will downmix/resample as needed
          this.recognizer.acceptWaveform(event.inputBuffer)
        } catch (error) {
          // Avoid spamming errors if shutting down
          if (this.started) this.events.onError?.(error)
        }
      }
      source.connect(this.recognizerNode)
      this.recognizerNode.connect(this.audioCtx.destination) // keep node alive

      this.started = true
    } catch (e) {
      this.events.onError?.(e)
      await this.stop()
      throw e
    }
  }

  async stop() {
    this.started = false
    try {
      if (this.recognizerNode) {
        try { this.recognizerNode.disconnect() } catch {}
        this.recognizerNode.onaudioprocess = null as any
      }
      if (this.audioCtx) {
        try { this.audioCtx.close() } catch {}
      }
      if (this.mediaStream) {
        for (const t of this.mediaStream.getTracks()) {
          try { t.stop() } catch {}
        }
      }
      if (this.recognizer && this.recognizer.remove) {
        try { this.recognizer.remove() } catch {}
      }
    } finally {
      this.recognizerNode = null
      this.audioCtx = null
      this.mediaStream = null
      this.recognizer = null
    }
  }
}
