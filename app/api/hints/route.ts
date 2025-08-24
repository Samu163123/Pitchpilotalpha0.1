import { NextResponse } from "next/server"

const HINTS_TARGET = "https://kdawi.app.n8n.cloud/webhook-test/fde08c80-ae05-46a6-9cbf-49aa8c28826f"

export async function POST(req: Request) {
  const started = Date.now()
  try {
    const bodyText = await req.text()
    const contentType = req.headers.get("content-type") || "application/json"

    console.log("[API/hints] Forwarding POST ->", HINTS_TARGET)
    console.log("[API/hints] Content-Type:", contentType)
    console.log("[API/hints] Body length:", bodyText.length)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const upstream = await fetch(HINTS_TARGET, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: bodyText,
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const text = await upstream.text()
    console.log("[API/hints] Upstream status:", upstream.status, "elapsed:", Date.now() - started, "ms")
    return new NextResponse(text, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "text/plain" } })
  } catch (err) {
    console.error("[API/hints] Error:", err)
    return NextResponse.json({ error: "hints_proxy_error", message: String(err) }, { status: 502 })
  }
}
