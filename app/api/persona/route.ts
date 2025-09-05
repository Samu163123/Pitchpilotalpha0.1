import { NextResponse, NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MODEL_NAME = process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GOOGLE_API_KEY on server" }, { status: 500 })
    }

    const body = await req.json()
    const { marketType, product, traits, count } = body

    if (!product?.name || !product?.description) {
      return NextResponse.json({ error: "Missing product name or description" }, { status: 400 })
    }

    const traitsText = Object.entries(traits || {})
      .map(([key, value]) => `${key}: ${value || "(empty)"}`)
      .join("\n")

    const prompt = `You are to return ONLY valid JSON with Content-Type application/json. No markdown, no code fences, no commentary. Your response MUST conform to this TypeScript type: { "personas": Array<{ "personaName": string, "background": string, "demographics": string, "psychographics": string, "painPoints": string, "mindset": string, "quote": string }> }
Each persona must be a complete object with all keys above filled as strings.

User:
Market Type: ${marketType || "B2C"} // "B2B" or "B2C"

Product:
Name: ${product.name}
Description: ${product.description}

Existing traits (if a value is present, keep it verbatim; if missing/empty, generate it):
${traitsText}

Instructions:
Make the Buyer represent a business if Market Type = B2B or make them be an individual customer that is either looking to invest in the product or buy for themselves if Market Type = B2C

Generate exactly ${count || 2} distinct persona options in the "personas" array.
Tailor each persona to the specified Market Type:
If B2B: emphasize role, company size/industry, decision-making process, buying committee, KPIs, procurement friction.
If B2C: emphasize lifestyle, personal values, routines, brand preferences, individual purchase drivers.

Persona requirements for each option:
personaName: e.g., “Eco-conscious Elena”
background: role, industry, seniority, relevant experience
demographics: age, gender, location, education, income
psychographics: values, traits, interests, lifestyle
painPoints: concrete problems they want solved
mindset: attitudes toward solutions and purchasing
quote: one-line statement capturing their perspective

Tone: professional, concise, specific (avoid fluff).
Output JSON example (structure only; fill with your generated content): { "personas": [ { "personaName": "...", "background": "...", "demographics": "...", "psychographics": "...", "painPoints": "...", "mindset": "...", "quote": "..." }, { "personaName": "...", "background": "...", "demographics": "...", "psychographics": "...", "painPoints": "...", "mindset": "...", "quote": "..." } ] }`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL_NAME)}:generateContent?key=${apiKey}`

    const apiReqBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.8,
        maxOutputTokens: 8192,
      },
    }

    const apiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiReqBody),
    })

    if (!apiRes.ok) {
      const errorBody = await apiRes.text()
      console.error("[API] Gemini API error:", errorBody)
      return NextResponse.json({ error: "Gemini API request failed", details: errorBody }, { status: apiRes.status })
    }

    const json = await apiRes.json()
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return NextResponse.json({ error: "Invalid response from Gemini API", details: json }, { status: 500 })
    }

    // The model should return JSON directly, but let's parse it just in case
    try {
      const parsed = JSON.parse(text)
      return NextResponse.json(parsed)
    } catch (e) {
      // Fallback for cases where the model might still wrap it in markdown
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1])
          return NextResponse.json(parsed)
        } catch (e2) {
          console.error("[API] Failed to parse extracted JSON:", e2)
          return NextResponse.json({ error: "Failed to parse extracted JSON from Gemini response", details: text }, { status: 500 })
        }
      }
      console.error("[API] Failed to parse JSON:", e)
      return NextResponse.json({ error: "Failed to parse JSON from Gemini response", details: text }, { status: 500 })
    }

  } catch (err: any) {
    console.error("[API] /api/persona internal error:", err)
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 },
    )
  }
}
