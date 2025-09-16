import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode, messages, existingNotes = '' } = body as {
      mode: 'initial' | 'incremental'
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      existingNotes?: string
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_API_KEY is not configured' }, { status: 500 })
    }

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    // Use the same fast model family we already use elsewhere; upgradeable later
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const transcriptPlain = messages
      .map((m) => `${m.role === 'user' ? 'Salesperson' : 'Buyer'}: ${m.content}`)
      .join('\n')

    const systemPrompt = `You are a sales notes generator. Extract only the client's (Buyer) important stated details.

Return ONLY formatted notes text in blocks, each block separated by a blank line, following EXACTLY this format:
<icon> **<Category>** (<timestamp>)\n"<short quoted buyer statement>"

- Category: one of Budget, Decision, Timeline, Concern, Objection, Preference, Requirement, Competition, Authority, Other
- Icon: a relevant emoji
- Timestamp: if not provided, omit or reuse a placeholder like Now
- The quoted text should be concise and come from buyer content or a tight paraphrase.
- Avoid duplicates: if an existing notes list is provided, do not repeat what already exists (consider semantic similarity).
- For incremental mode, only extract from the NEW messages provided, but also consider existing notes to avoid duplicates.
- Keep it concise and useful for a salesperson.
`

    const userPrompt = `Mode: ${mode}\nExisting Notes (may be empty):\n${existingNotes}\n\nTranscript to analyze:\n${transcriptPlain}`

    const result = await model.generateContent(systemPrompt + '\n\n' + userPrompt)
    const response = await result.response
    const notesText = response.text().trim()

    // Basic safeguard: limit very large responses
    const safeText = notesText.slice(0, 8000)

    return NextResponse.json({ notesText: safeText })
  } catch (err) {
    console.error('[Notes API] Error:', err)
    return NextResponse.json({ error: 'Failed to generate notes' }, { status: 500 })
  }
}
