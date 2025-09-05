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

    const callType = scenarioSettings?.callType;
    const userPrompt = `Transcript: ${transcript}, Product: ${product?.name || 'Unknown Product'}: ${product?.description || 'No description available'}. Buyer profile: ${persona?.personaName || 'Unknown'}, ${persona?.background || ''}, ${persona?.painPoints || ''}, ${persona?.mindset || ''}${callType ? `. Call Type: ${callType.name} - ${callType.description}. Goal: ${callType.goal}` : ''}`;

    const systemPrompt = `You are a sales coach AI. Based on the current conversation between the user and a prospect, provide tailored coaching suggestions that help the user improve their sales approach. Suggestions should be short, actionable, and in the style of professional sales coaching (e.g., 'Listen for pain points and acknowledge them before presenting your solution,' 'Use the Feel, Felt, Found technique to handle objections,' 'Create urgency with a compelling reason to act now'). Always generate 2–3 relevant suggestions. After the suggestions, provide one complete next sentence the user could say to the prospect, written in a natural and persuasive tone that fits the ongoing conversation. You should provide each complete sentence after the corresponding suggestion. You are going to provide a list of suggestions. Format the output exactly as follows:

1. Write the main suggestion.  
2. On the next line, write an example sentence in quotes that illustrates the suggestion.  
3. Separate each suggestion + example sentence pair with \\n.  
4. Do NOT include labels like "the suggestion" or extra explanations.  
5. Repeat this format for all suggestions.  

Output only in this format, no extra text. For example:

[Main suggestion 1] \\n
"[Example sentence 1]" \\n
[Main suggestion 2] \\n
"[Example sentence 2]" \\n
...`;

    const result = await model.generateContent(systemPrompt + '\n\n' + userPrompt);

    const response = await result.response;
    const suggestions = response.text();

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
