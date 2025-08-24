import { NextResponse } from "next/server"

const ANALYSIS_TARGET = "https://kdawi.app.n8n.cloud/webhook-test/c7f1ebc9-edae-4258-802a-dbb4a5f28317"

export async function POST(req: Request) {
  const started = Date.now()
  try {
    const bodyText = await req.text()
    const contentType = req.headers.get("content-type") || "application/json"

    console.log("[API/analysis] Forwarding POST ->", ANALYSIS_TARGET)
    console.log("[API/analysis] Content-Type:", contentType)
    console.log("[API/analysis] Body length:", bodyText.length)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const upstream = await fetch(ANALYSIS_TARGET, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: bodyText,
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const text = await upstream.text()
    console.log("[API/analysis] Upstream status:", upstream.status, "elapsed:", Date.now() - started, "ms")
    return new NextResponse(text, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "text/plain" } })
  } catch (err) {
    console.error("[API/analysis] Error:", err)
    return NextResponse.json({ error: "analysis_proxy_error", message: String(err) }, { status: 502 })
  }
}
