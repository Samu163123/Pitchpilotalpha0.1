import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Default to the user's test webhook URL if env is not set
const DEFAULT_TEST_URL = "https://kdawi.app.n8n.cloud/webhook/8a782625-9127-4afa-a348-7b1866716252"

export async function POST(req: Request) {
  const url =
    process.env.N8N_WEBHOOK_URL ??
    process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ??
    DEFAULT_TEST_URL

  if (!url) {
    return NextResponse.json(
      { error: "N8N webhook URL not configured" },
      { status: 500 }
    )
  }

  console.groupCollapsed("[API] /api/n8n proxy POST")
  console.debug("target url:", url)

  try {
    const incomingContentType = req.headers.get("content-type") ?? "application/json"
    const bodyText = await req.text()
    console.debug("incoming content-type:", incomingContentType)
    console.debug("incoming body length:", bodyText.length)

    console.time("[API] upstream fetch")
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": incomingContentType,
      },
      body: bodyText,
      cache: "no-store",
    })
    console.timeEnd("[API] upstream fetch")

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
    console.warn("[API] Proxy fetch failed:", err)
    console.groupEnd()
    return NextResponse.json(
      { error: "Proxy fetch failed", details: String(err) },
      { status: 502 }
    )
  }
}
