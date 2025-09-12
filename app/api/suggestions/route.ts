import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { messages, product, persona, scenarioSettings } = await request.json();

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Build transcript from messages
    const transcript = messages
      .map((msg: any) => `${msg.role === 'user' ? 'Salesperson' : 'Prospect'}: ${msg.content}`)
      .join('\n');

    // Identify the latest Prospect (assistant) message to bias suggestions toward the most recent objection/context
    const latestProspectMsg = [...messages].reverse().find((m: any) => m.role !== 'user')?.content || '';

    const callType = scenarioSettings?.callType;
    const userPrompt = `Transcript: ${transcript}\nLatest prospect message: ${latestProspectMsg}\nProduct: ${product?.name || 'Unknown Product'} - ${product?.description || 'No description available'}\nBuyer profile: ${persona?.personaName || 'Unknown'}; Background: ${persona?.background || ''}; Pains: ${persona?.painPoints || ''}; Mindset: ${persona?.mindset || ''}${callType ? `\nCall Type: ${callType.name} - ${callType.description}. Goal: ${callType.goal}` : ''}`;

    const systemPrompt = `You are a senior sales coach AI. Generate suggestions that are:
• Targeted to the most recent prospect objection or concern (use the Latest prospect message as the main signal).
• Natural, conversational, and not pushy or hypey. Avoid jargon and over-selling.
• Actionable in 1–2 short sentences, favoring consultative questions and mirroring language.
• Influenced by proven approaches: Jeremy Miner's NEPQ (diagnostic questions), Alex Hormozi's value math (clarify outcomes and constraints), Simon Squibb's empathetic listening (reflect and validate), Grant Cardone's certainty and next steps (clear CTAs without pressure).

Guidelines:
• Start by acknowledging and labeling the objection or concern when relevant.
• Prefer questions that progress discovery (problem, impact, timeline, authority, budget) over pitching features.
• Tie recommendations to the stated pains and the product's outcomes. Keep it specific to context.
• Keep tone calm, professional, and collaborative.
• Generate exactly 2 suggestions.

Formatting rules (strict):
1. Write the main suggestion on one line.
2. On the next line, write a natural example sentence in quotes that the salesperson could say next.
3. Separate each suggestion + example pair with a single newline.
4. Do NOT include extra commentary, numbering, headers, or explanations.

Output only in this exact format. Example:
[Main suggestion 1]\n
"[Example sentence 1]"\n
[Main suggestion 2]\n
"[Example sentence 2]"`;

    const result = await model.generateContent(systemPrompt + '\n\n' + userPrompt);

    const response = await result.response;
    const raw = response.text();

    // Post-process to strictly keep exactly 2 suggestion blocks (headline + example)
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const pairs: { head: string; ex?: string }[] = [];
    for (let i = 0; i < lines.length && pairs.length < 2; i++) {
      const head = lines[i];
      if (head.startsWith('"') && head.endsWith('"')) {
        // skip orphan example
        continue;
      }
      let ex: string | undefined = undefined;
      const next = lines[i + 1];
      if (next && next.startsWith('"') && next.endsWith('"')) {
        ex = next;
        i += 1;
      }
      pairs.push({ head, ex });
    }

    // Fallback: if less than 2 pairs, pad with simple discovery prompts
    while (pairs.length < 2) {
      pairs.push({
        head: 'Ask a concise discovery question tied to their last concern.',
        ex: '"Just so I understand correctly, what would need to be true for this to feel like a clear win for you?"',
      });
    }

    const suggestions = pairs
      .map((p) => `${p.head}\n${p.ex ?? '"Can you share a bit more about that so I don\'t make assumptions?"'}`)
      .join('\n\n');

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
