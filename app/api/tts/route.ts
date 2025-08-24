/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// Simple in-memory audio queue per session
// Each item stores raw bytes and the upstream content-type
export const audioQueue: Map<string, Array<{ bytes: Buffer; contentType: string }>> = (global as any)._ttsAudioQueue || new Map()
;(global as any)._ttsAudioQueue = audioQueue

// Proxy POST to external TTS uploader that returns audio. Kept server-side to avoid CORS.
const REMOTE_TTS_BASE = "https://56c1027c07d4.ngrok-free.app/upload?sid="

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const sid = url.searchParams.get("sid") || ""
    const consume = (url.searchParams.get("consume") ?? "1") !== "0"
    if (!sid) {
      return NextResponse.json({ error: "missing_sid", message: "Query param 'sid' is required." }, { status: 400 })
    }
    const q = audioQueue.get(sid)
    if (!q || q.length === 0) {
      return NextResponse.json({ error: "no_audio", message: "No queued audio for this sid." }, { status: 404 })
    }
    const item = consume ? q.shift()! : q[0]
    if (consume && q.length === 0) audioQueue.delete(sid)
    return new NextResponse(item.bytes, {
      status: 200,
      headers: { "content-type": item.contentType || "audio/mpeg" },
    })
  } catch (e: any) {
    return NextResponse.json({ error: "pull_failed", message: String(e?.message || e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const sid = url.searchParams.get("sid") || ""
    if (!sid) {
      return NextResponse.json({ error: "missing_sid", message: "Query param 'sid' is required." }, { status: 400 })
    }

    // Prefer forwarding the body verbatim (supports binary/form-data/json). If no body, allow text via query param.
    let upstreamBody: BodyInit | null = null
    let contentType = req.headers.get("content-type") || undefined

    const bodyArrayBuffer = await req.arrayBuffer().catch(() => undefined)
    if (bodyArrayBuffer && bodyArrayBuffer.byteLength > 0) {
      upstreamBody = Buffer.from(bodyArrayBuffer)
    } else {
      const text = url.searchParams.get("text")
      if (text) {
        upstreamBody = JSON.stringify({ text })
        contentType = "application/json"
      }
    }

    const upstreamUrl = REMOTE_TTS_BASE + encodeURIComponent(sid)
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: contentType ? { "Content-Type": contentType } : undefined,
      body: upstreamBody,
      cache: "no-store",
    })

    const upstreamContentType = upstream.headers.get("content-type") || "application/octet-stream"
    const buffer = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      status: upstream.status,
      headers: {
        "content-type": upstreamContentType,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: "proxy_failed", message: String(e?.message || e) }, { status: 502 })
  }
}
