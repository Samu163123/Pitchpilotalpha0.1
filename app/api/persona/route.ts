import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Fixed Buyer Persona Generation webhook URL provided by user
const PERSONA_WEBHOOK_URL = "https://wadwadd.app.n8n.cloud/webhook-test/991d57ff-2f13-4c47-9919-94a851387855"

export async function POST(req: Request) {
  const url = PERSONA_WEBHOOK_URL

  console.groupCollapsed("[API] /api/persona proxy POST")
  console.debug("target url:", url)
  try {
    const incomingContentType = req.headers.get("content-type") ?? "application/json"
    const bodyText = await req.text()
    console.debug("incoming content-type:", incomingContentType)
    console.debug("incoming body length:", bodyText.length)

    console.time("[API] upstream fetch (persona)")
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": incomingContentType,
      },
      body: bodyText,
      cache: "no-store",
      // no abort signal: let upstream take its time
    })
    console.timeEnd("[API] upstream fetch (persona)")

    const text = await resp.text()

    console.debug("upstream status:", resp.status, resp.statusText)
    console.debug("upstream content-type:", resp.headers.get("content-type"))
    console.debug("upstream body length:", text.length)

    console.groupEnd()
    return new NextResponse(text, {
      status: resp.status,
      statusText: resp.statusText,
      headers: {
        "content-type": resp.headers.get("content-type") || "text/plain",
      },
    })
  } catch (err: any) {
    console.warn("[API] Persona proxy fetch failed:", err)
    console.groupEnd()
    return NextResponse.json(
      { error: "Persona proxy fetch failed", details: String(err) },
      { status: 502 },
    )
  }
}
