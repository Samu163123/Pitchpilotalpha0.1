import { NextRequest, NextResponse } from "next/server"

const MODEL_NAME = process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GOOGLE_API_KEY on server" }, { status: 500 })
    }

    const { productName, hints } = await req.json().catch(() => ({ }))
    if (!productName || typeof productName !== "string") {
      return NextResponse.json({ error: "Missing required field: productName" }, { status: 400 })
    }

    const prompt = `You are a product marketing expert. Write a concise, compelling product description (70-120 words) for a product named "${productName}".
- Focus on benefits and outcomes.
- Use clear, accessible language.
- Avoid hype and buzzwords.
${hints?.length ? `- Incorporate these hints if helpful: ${String(hints)}` : ""}`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL_NAME)}:generateContent?key=${apiKey}`

    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 200,
      },
    }

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "")
      return NextResponse.json(
        { error: `Gemini API error (${resp.status})`, details: errText?.slice(0, 500) },
        { status: 502 }
      )
    }

    const data = await resp.json()
    // Extract text safely
    const description: string = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join("")?.trim() || ""
    if (!description) {
      return NextResponse.json({ error: "Empty response from model" }, { status: 502 })
    }

    return NextResponse.json({ description })
  } catch (err: any) {
    return NextResponse.json({ error: "Unexpected server error", details: String(err).slice(0, 500) }, { status: 500 })
  }
}
