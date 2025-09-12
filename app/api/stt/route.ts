import { NextRequest, NextResponse } from 'next/server'
import { pipeline, env } from '@xenova/transformers'
import path from 'node:path'
//

// Node runtime is required for @xenova/transformers
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Increase for first-time model download/initialization
export const maxDuration = 120

// Optional: configure Hugging Face access token and cache dir
// If you hit Unauthorized/rate-limited errors, create an HF token and set HF_ACCESS_TOKEN in your env.
env.allowRemoteModels = true
env.useBrowserCache = false
env.cacheDir = path.resolve(process.cwd(), '.transformers-cache')
// Optionally authenticate to Hugging Face to avoid 401/403 (set HF_ACCESS_TOKEN in .env.local)
if (process.env.HF_ACCESS_TOKEN) {
  (env as any).HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN
}

let transcriber: any | null = null
let transcriberModelId: string | null = null

async function getTranscriber() {
  if (!transcriber) {
    // Prefer env override, else default to Moonshine
    const primaryId = process.env.MOONSHINE_MODEL_ID || 'Xenova/moonshine-small'
    try {
      transcriber = await pipeline('automatic-speech-recognition', primaryId)
      transcriberModelId = primaryId
    } catch (e: any) {
      // If Moonshine fails due to missing tokenizer files or permissions, fall back to Whisper for continuity
      const fallbackId = process.env.FALLBACK_ASR_MODEL_ID || 'Xenova/whisper-small'
      try {
        transcriber = await pipeline('automatic-speech-recognition', fallbackId)
        transcriberModelId = fallbackId
        // eslint-disable-next-line no-console
        console.warn(`[STT] Falling back to ${fallbackId} due to error loading ${primaryId}:`, e?.message || e)
      } catch (e2: any) {
        // Re-throw detailed error
        const reason = `Failed to load ASR models. Primary: ${primaryId}. Fallback: ${fallbackId}. Error: ${e2?.message || e2}`
        throw new Error(reason)
      }
    }
  }
  return transcriber
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data with field "audio"' }, { status: 400 })
    }

    const form = await req.formData()
    const file = form.get('audio')

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Missing file field "audio"' }, { status: 400 })
    }

    const asr = await getTranscriber()

    // Convert uploaded audio to Buffer for Node processing
    const buffer = Buffer.from(await (file as Blob).arrayBuffer())
    // eslint-disable-next-line no-console
    console.log('[STT] Received audio bytes:', buffer.length, 'model:', transcriberModelId)

    // Try to decode WAV to Float32Array (preferred for Whisper/Moonshine)
    let input: any = buffer
    const filename = (file as any)?.name || 'audio'
    const isWav = /\.wav$/i.test(filename) || /audio\/wav|wave/.test((file as any)?.type || '')
    if (isWav) {
      try {
        const decoded = decodeWavToFloat32(buffer)
        // Preferred shape: pass raw Float32Array with explicit sampling_rate
        input = { audio: decoded.data, sampling_rate: decoded.sampleRate }
        // eslint-disable-next-line no-console
        console.log('[STT] Decoded WAV', { sampleRate: decoded.sampleRate, samples: decoded.data.length })
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.warn('[STT] WAV decode failed, passing raw buffer to pipeline:', e?.message || e)
        input = buffer
      }
    }

    let result: any
    try {
      result = await asr(input)
    } catch (e: any) {
      // Some pipelines expect shape { waveform, sampling_rate }
      if (input && input.audio && input.sampling_rate) {
        try {
          result = await asr({ waveform: input.audio, sampling_rate: input.sampling_rate })
        } catch (e2: any) {
          // Fallback to raw array only
          try {
            result = await asr(input.audio as Float32Array)
          } catch (e3: any) {
            throw e3
          }
        }
      } else {
        throw e
      }
    }
    const text: string = result?.text ?? ''
    const payload: any = { transcript: text, model: transcriberModelId || 'unknown' }
    if (!text) {
      payload.debug = {
        wav: isWav,
        bytes: buffer.length,
        sampling_rate: (input && input.sampling_rate) || undefined,
        samples: (input && (input.audio?.length || input.length)) || undefined,
      }
    }
    return NextResponse.json(payload)
  } catch (err: any) {
    const message = String(err?.message || err)
    // Surface common HF errors better
    const hint = message.match(/Unauthorized|forbidden|token|could not locate|not found|404/i)
      ? 'Check HF token (.env.local: HF_ACCESS_TOKEN) and model id (env MOONSHINE_MODEL_ID).'
      : undefined
    return NextResponse.json({ error: 'STT failed', details: message, hint }, { status: 500 })
  }
}

// Minimal WAV (PCM) decoder -> Float32Array mono @ source sample rate.
// Supports PCM 16-bit LE mono/stereo. Downmix stereo -> mono.
function decodeWavToFloat32(buf: Buffer): { data: Float32Array; sampleRate: number } {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  // Check RIFF/WAVE
  if (readStr(dv, 0, 4) !== 'RIFF' || readStr(dv, 8, 4) !== 'WAVE') {
    throw new Error('Not a RIFF/WAVE file')
  }
  // Find 'fmt ' chunk
  let offset = 12
  let audioFormat = 1
  let numChannels = 1
  let sampleRate = 16000
  let bitsPerSample = 16
  let dataOffset = -1
  let dataSize = 0

  while (offset + 8 <= dv.byteLength) {
    const id = readStr(dv, offset, 4)
    const size = dv.getUint32(offset + 4, true)
    const next = offset + 8 + size
    if (id === 'fmt ') {
      audioFormat = dv.getUint16(offset + 8, true)
      numChannels = dv.getUint16(offset + 10, true)
      sampleRate = dv.getUint32(offset + 12, true)
      bitsPerSample = dv.getUint16(offset + 22, true)
    } else if (id === 'data') {
      dataOffset = offset + 8
      dataSize = size
      break
    }
    offset = next
  }
  if (dataOffset < 0) throw new Error('WAV data chunk not found')
  if (audioFormat !== 1) throw new Error(`Unsupported WAV format: ${audioFormat}`)
  if (bitsPerSample !== 16) throw new Error(`Unsupported WAV bit depth: ${bitsPerSample}`)

  const bytesPerSample = bitsPerSample / 8
  const frameCount = Math.floor(dataSize / (bytesPerSample * numChannels))
  const out = new Float32Array(frameCount)
  let inPtr = dataOffset
  for (let i = 0; i < frameCount; i++) {
    let sample = 0
    if (numChannels === 1) {
      sample = dv.getInt16(inPtr, true)
      inPtr += 2
    } else {
      // downmix stereo -> mono
      const l = dv.getInt16(inPtr, true)
      const r = dv.getInt16(inPtr + 2, true)
      sample = (l + r) / 2
      inPtr += 4
    }
    out[i] = sample / 32768
  }
  return { data: out, sampleRate }
}

function readStr(dv: DataView, offset: number, len: number): string {
  let s = ''
  for (let i = 0; i < len; i++) s += String.fromCharCode(dv.getUint8(offset + i))
  return s
}
