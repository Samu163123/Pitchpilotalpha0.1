import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Node runtime is required for file handling
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })
    }

    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data with field "audio"' }, { status: 400 })
    }

    const form = await req.formData()
    const file = form.get('audio')
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Missing file field "audio"' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey })

    // Rewrap the incoming Blob into a File so OpenAI SDK has filename and type
    const filename = (file as any)?.name || 'audio.wav'
    const wrapped = new File([await file.arrayBuffer()], filename, { type: (file as any)?.type || 'audio/wav' })

    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: wrapped as any,
      response_format: 'json'
    })

    const text = (transcription as any)?.text || ''
    return NextResponse.json({ transcript: text, model: 'whisper-1' })
  } catch (err: any) {
    const message = String(err?.message || err)
    return NextResponse.json({ error: 'STT failed', details: message }, { status: 500 })
  }
}
