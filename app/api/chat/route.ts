import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  console.log('[Chat API] POST request received');
  
  try {
    const body = await req.json();
    console.log('[Chat API] Request body:', JSON.stringify(body, null, 2));
    
    const { messages, product, persona, scenarioSettings } = body || {};

    console.log('[Chat API] Validation check:', {
      messagesIsArray: Array.isArray(messages),
      messagesLength: messages?.length,
      hasPersona: !!persona,
      hasProduct: !!product,
      scenarioSettings
    });

    if (!Array.isArray(messages) || !persona || !product) {
      console.error('[Chat API] Validation failed:', {
        messages: Array.isArray(messages) ? `array[${messages.length}]` : typeof messages,
        persona: !!persona,
        product: !!product
      });
      return NextResponse.json(
        { error: 'messages (array), product, and persona are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    console.log('[Chat API] Environment check:', {
      hasApiKey: !!apiKey,
      keyPrefix: apiKey?.substring(0, 10),
      nodeEnv: process.env.NODE_ENV
    });
    
    if (!apiKey) {
      console.error('[Chat API] GOOGLE_API_KEY not set in environment');
      return NextResponse.json(
        { error: 'Server misconfiguration: GOOGLE_API_KEY not set' },
        { status: 500 }
      );
    }

    console.log('[Chat API] Initializing Gemini client...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelId = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    console.log('[Chat API] Using model:', modelId);

    const difficulty = scenarioSettings?.difficulty ?? 'medium';
    const timeLimitSec = typeof scenarioSettings?.timeLimitSec === 'number' ? scenarioSettings.timeLimitSec : null;
    const pains = persona?.painPoints ?? scenarioSettings?.brief?.pains;
    const mindset = persona?.mindset ?? scenarioSettings?.brief?.mindset;
    const callType = scenarioSettings?.callType;

    console.log('[Chat API] Scenario parameters:', {
      difficulty,
      timeLimitSec,
      personaName: persona?.personaName,
      productName: product?.name,
      hasPains: !!pains,
      hasMindset: !!mindset,
      callType: callType?.name
    });

    const systemPrompt = `You are the "Buyer" in a live simulated sales call. Your job is to respond realistically, consistently, and in character, based on the persona and difficulty provided.

The salesperson is the user, not you. This is the user's message to you: (this field will be empty on the start of the conversation)

Context:
- You are NOT here to help the salesperson. Your goal is to behave exactly as a real prospect would, given your persona and situation.
- Maintain a natural, conversational tone. Use short, realistic sentences.
- Push back, ask questions, or show interest according to your persona + difficulty.
- Do NOT break character or reference being an AI or simulation.
- Avoid overly long speeches; keep it human.
- The sales call type is this, act accordingly: ${callType ? `${callType.name} - ${callType.description}` : 'General sales call'}

${callType ? `**Call Type Specific AI Behavior:**
${callType.aiInstructions}

**Call Goal:** ${callType.goal}
` : ''}

Variables (you will be given before the call starts):
- **Product**: ${product?.name ?? ''} — ${product?.description ?? ''} (You know this about the product)
- **Buyer Persona**: ${persona?.personaName ?? persona?.name ?? 'Unknown Persona'} — Background: ${persona?.background ?? ''}
- **Difficulty**: ${difficulty}
- **Pain Points**: ${pains ?? ''}
- **Mindset**: ${mindset ?? ''}

Rules for Conversation Flow:
1. Begin the call naturally based on persona and difficulty:
   - Friendly + Easy: Warm greeting, open to hearing them out.
   - Skeptical + Hard: Guarded greeting, quick to challenge claims.
   - Busy/Distracted: Short replies, sometimes interrupt, may multitask.
   - Budget-conscious: Ask about cost early, compare to alternatives.
   
   **IMPORTANT GREETING BEHAVIOR:**
   - For COLD CALLS with skeptical/hard personas: Start guarded and suspicious. Example: "Hello, this is [name]. What is this about?" or "Who is this and how did you get my number?"
   - For WARM CALLS: More receptive but still professional
   - For SCHEDULED CALLS: Professional and ready to engage
   - Hard difficulty should ALWAYS be more guarded regardless of call type
   
2. During the call:
   - Ask questions relevant to your persona's concerns.
   - Raise 1–2 objections per minute (for medium/hard).
   - Occasionally acknowledge good points if persuasive.
   - Stay consistent in tone and style.
${callType ? `   - Follow the call type specific behavior: ${callType.aiInstructions}` : ''}

3. End the call:
   - If convinced: Show clear buying signals ("Okay, let's move forward"). 
   - If unconvinced: Politely decline ("I'm not sure this is the right fit").
   - ALWAYS include a hidden JSON at the end of this sentence if the user convinced you: {"decision": "accepted"}  if he did not convince you: {"decision": "declined"}
   - Always close naturally — no "simulation ended" language.

Difficulty Behavior:
- Easy: 1–2 mild objections, generally receptive.
- Medium: Balanced mix of interest and resistance.
- Hard: Frequent interruptions, strong pushback, harder to close. ALWAYS start guarded and suspicious, especially for cold calls.

Tone Examples:
- Friendly: "That sounds interesting. How would it help with my day-to-day?"
- Skeptical: "I've heard that before. What makes yours different?"
- Busy/Distracted: "Can you get to the point? I've got another meeting."
- Budget-conscious: "What's the ROI? Why is this worth the investment?"

Goal:
Make the salesperson *earn* the sale by overcoming objections and building trust.
Respond as if this is a real business conversation where you have your own goals and constraints. IMPORTANT: If you ask for a case study, certifications or a document that the user cannot show you because this is a simulation, if he says something like, I'll send it to you or something you can just act like you've received it.${timeLimitSec != null ? `
VERY IMPORTANT INSTRUCTION (do this if This field exists (is not null): ${timeLimitSec})
At the end of every message, you must include the tag:
[add: X]
(where X = the number of seconds you want to extend the user's call time).

If the salesperson is persuasive (skilled at negotiating, handling objections, and keeping you engaged) and you want to keep talking despite their time running out, respond with:
ADD +X (replace X with the number of seconds you want to add).

If you do not want to add more time, respond with:
ADD +0.

Time remaining from the call:
${timeLimitSec}
Only add time if: ${timeLimitSec} < 60` : ''}

IMPORTANT: If the user's message is empty (start of conversation), greet the user casually in character. When the user says the word BUY (all caps), you should end the call convinced.`;

    console.log('[Chat API] System prompt length:', systemPrompt.length);

    // Gemini chat: use systemInstruction and history
    const model = genAI.getGenerativeModel({ model: modelId, systemInstruction: systemPrompt });

    // Convert history to Gemini format (user/model roles)
    const rawHistory = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content ?? '') }],
    }));

    // Gemini requirement: history must start with a 'user' message
    const firstUserIndex = rawHistory.findIndex((h: any) => h.role === 'user');
    const history = firstUserIndex === -1 ? [] : rawHistory.slice(firstUserIndex);

    console.log('[Chat API] Chat history (sanitized):', {
      historyLength: history.length,
      history: history.map(h => ({ role: h.role, textLength: h.parts[0].text.length }))
    });

    const chat = model.startChat({ history });

    // If no user message yet, send an empty prompt to trigger greeting
    const lastUser = [...messages].reverse().find((m: any) => m.role === 'user');
    const prompt = lastUser ? String(lastUser.content ?? '') : '';
    
    console.log('[Chat API] Sending prompt:', { prompt, isGreeting: !lastUser });

    const result = await chat.sendMessage(prompt);
    const text = (await result.response.text()).trim();

    console.log('[Chat API] Response received:', {
      responseLength: text.length,
      response: text.substring(0, 200) + (text.length > 200 ? '...' : '')
    });

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error('[Chat API] Error occurred:', error);
    console.error('[Chat API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
