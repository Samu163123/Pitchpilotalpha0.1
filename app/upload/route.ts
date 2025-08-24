import { NextResponse } from "next/server"

export const runtime = "nodejs"

// In-memory audio store keyed by session id
const audioStore = new Map<string, { buf: Buffer; type: string; at: number }>()

function getKeyFromUrl(url: URL) {
  return (
    url.searchParams.get("sid") ||
    url.searchParams.get("sessionId") ||
    "default"
  )
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const key = getKeyFromUrl(url)

    const ct = req.headers.get("content-type") || ""

    let buf: Buffer | null = null
    let type = "application/octet-stream"

    if (ct.startsWith("multipart/form-data")) {
      const form = await req.formData()
      const file = form.get("file") as File | null
      if (!file) {
        return NextResponse.json({ error: "missing_file", message: "multipart/form-data must include 'file'" }, { status: 400 })
      }
      const ab = await file.arrayBuffer()
      buf = Buffer.from(ab)
      type = file.type || ct
    } else {
      const ab = await req.arrayBuffer()
      buf = Buffer.from(ab)
      // Try to infer audio type from content-type header if provided
      if (ct) type = ct
    }

    if (!buf || buf.length === 0) {
      return NextResponse.json({ error: "empty_body", message: "No audio bytes received" }, { status: 400 })
    }

    audioStore.set(key, { buf, type, at: Date.now() })

    return NextResponse.json({ ok: true, bytes: buf.length, type, sessionId: key })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const key = getKeyFromUrl(url)
  const pop = url.searchParams.get("pop") === "1"

  const entry = audioStore.get(key)
  if (!entry) {
    return NextResponse.json({ error: "not_found", message: "No audio available for session" }, { status: 404 })
  }

  if (pop) {
    audioStore.delete(key)
  }

  const headers = new Headers()
  headers.set("content-type", entry.type || "audio/mpeg")
  headers.set("content-length", String(entry.buf.length))
  headers.set("cache-control", "no-store")
  headers.set("content-disposition", `inline; filename=${key}-${entry.at}.bin`)

  return new NextResponse(entry.buf, { status: 200, headers })
}

export async function OPTIONS() {
  const headers = new Headers()
  headers.set("allow", "POST, GET, OPTIONS")
  return new NextResponse(null, { status: 204, headers })
}
