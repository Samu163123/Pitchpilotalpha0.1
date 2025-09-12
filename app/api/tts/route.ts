/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server"
import OpenAI from "openai"

export const runtime = "nodejs"

// POST /api/tts
// Body: { text: string; voice?: string; format?: "mp3"|"wav"|"ogg"|"flac"|"opus" }
// Returns synthesized audio using OpenAI TTS (tts-1) with default Alloy voice.
export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "missing_openai_key",
          message: "OPENAI_API_KEY is not set. Please add it to your .env.local file.",
        },
        { status: 500 }
      )
    }

    let text = ""
    let voice = "alloy"
    let format: "mp3" | "wav" | "flac" | "opus" | "aac" | "pcm" = "mp3"

    const contentType = req.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({} as any))
      text = body?.text ?? ""
      voice = body?.voice || voice
      if (body?.format) format = body.format
    } else {
      // support GET-like fallback via query param for convenience
      const url = new URL(req.url)
      text = url.searchParams.get("text") || ""
      voice = url.searchParams.get("voice") || voice
      const f = url.searchParams.get("format") as any
      if (f) format = f
    }

    // Validate/normalize format
    const allowed = new Set(["mp3", "wav", "flac", "opus", "aac", "pcm"] as const)
    if (!allowed.has(format as any)) {
      format = "mp3"
    }

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "missing_text", message: "Provide a text string to synthesize in the request body or query." },
        { status: 400 }
      )
    }

    const openai = new OpenAI({ apiKey })

    // Debug: log request parameters (omit raw text)
    console.debug("[api/tts] Synth start", {
      textLength: text.length,
      voice,
      format,
    })

    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text,
      response_format: format,
    })

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const contentTypeOut =
      format === "mp3"
        ? "audio/mpeg"
        : format === "wav"
        ? "audio/wav"
        : format === "flac"
        ? "audio/flac"
        : format === "opus"
        ? "audio/opus"
        : format === "aac"
        ? "audio/aac"
        : "audio/L16" // pcm

    const res = new NextResponse(buffer, {
      status: 200,
      headers: {
        "content-type": contentTypeOut,
        "cache-control": "no-store",
      },
    })
    console.debug("[api/tts] Synth success", { bytes: buffer.byteLength, contentType: contentTypeOut })
    return res
  } catch (e: any) {
    const status = (e?.status as number) || (e?.response?.status as number) || 500
    const detail = e?.response?.data || e?.error || e?.message || String(e)
    console.error("[api/tts] Synth error", { status, detail })
    return NextResponse.json(
      { error: "tts_failed", message: typeof detail === 'string' ? detail : JSON.stringify(detail) },
      { status }
    )
  }
}

// Optional: simple info handler for GET
export async function GET() {
  return NextResponse.json({ ok: true, provider: "openai", model: "tts-1", defaultVoice: "alloy" })
}
