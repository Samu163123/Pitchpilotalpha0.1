import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Evaluation API] Request body:', JSON.stringify(body, null, 2));
    
    const { transcript, product, persona, scenario, decision, sessionId } = body;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Validate required data
    if (!transcript || !Array.isArray(transcript)) {
      console.error('[Evaluation API] Invalid transcript:', transcript);
      return NextResponse.json(
        { error: 'Invalid transcript data' },
        { status: 400 }
      );
    }

    // Build transcript from messages
    const transcriptPlain = transcript
      .map((msg: any) => `${msg.role === 'user' ? 'Salesperson' : 'Buyer'}: ${msg.content}`)
      .join('\n');

    console.log('[Evaluation API] Transcript length:', transcriptPlain.length);
    console.log('[Evaluation API] Product:', product?.name);
    console.log('[Evaluation API] Persona:', persona?.personaName);
    console.log('[Evaluation API] Decision:', decision);

    const userPrompt = `This is the transcript of the chat: ${transcriptPlain}, The product: ${product?.name || 'Unknown'}: ${product?.description || 'No description'}, buyer persona: ${persona?.personaName || 'Unknown'}, ${persona?.background || ''}, ${persona?.painPoints || ''}, ${persona?.mindset || ''}, sessionID: ${sessionId}, AI's decision: ${decision}`;

    const systemPrompt = `Role
You are a sales coaching AI that evaluates a sales call and provides concise, actionable feedback.

Inputs
sessionId: string
decision: "accepted" | "declined" | null
scenario: includes product, persona, difficulty, brief
metrics: talkTimeRatio, questionCount, closesCount, interruptionCount
transcript: array of segments [{ id, role: "user" | "buyer", text, timestamp }]

Goals
Evaluate the call quality and outcome.
Explain why, with specific, actionable guidance.
Keep feedback tight and easy to scan.
Do not reveal internal reasoning beyond requested fields.

Evaluation rubric
Score each category 0–100:
Objection handling: identified/validated concerns, addressed with techniques, moved forward.
Rapport: empathy, mirroring, personalization to persona, positive tone.
Closing: clear next steps, trial closes, call-to-action strength.
Clarity: structure, brevity, jargon, interrupting.
Overall score: rounded average of the four categories.

Outcome:
If input decision = accepted → outcome = "win".
If input decision = declined → outcome = "loss".
If input decision = null → infer from transcript; if ambiguous, choose "loss" and explain ambiguity in summary.

Key moments selection
Choose 2–3 user messages that are longer or pivotal.
For each, provide:
whatWorked: 1 sentence, specific to that moment.
tryInstead: 1 sentence, precise improvement.
Use the segment's timestamp for reference.

Persona/difficulty awareness
Adapt feedback to scenario.persona and scenario.difficulty.
Hard difficulty should not harshly penalize normal resistance; grade relative to difficulty.

Output format
Return ONLY valid JSON. No Markdown. No extra text.
Keep strings concise. Each field ≤ 300 chars unless noted.

{
  "sessionId": "<string>",
  "outcome": "win" | "loss",
  "decision_source": "input" | "inferred",
  "score": 0,
  "categories": {
    "objection": 0,
    "rapport": 0,
    "closing": 0,
    "clarity": 0
  },
  "summary": "<2-3 sentences explaining overall performance and outcome>",
  "strengths": ["<bullet point>", "<bullet point>"],
  "improvements": ["<bullet point>", "<bullet point>"],
  "moments": [
    {
      "timestamp": 0,
      "title": "Key Moment 1",
      "whatWorked": "<1 sentence>",
      "tryInstead": "<1 sentence>"
    }
  ],
  "next_skill": "<one of: Objection Handling | Building Rapport | Closing Techniques | Clear Communication>",
  "suggested_next_actions": [
    "<micro-action #1>",
    "<micro-action #2>"
  ],
  "notes": {
    "persona": "<how persona influenced behavior>",
    "difficulty_adjustment": "<how difficulty affected scoring>"
  }
}

Scoring guidance
90–100: Exemplary; tight discovery, tailored value, strong close.
75–89: Solid; minor gaps in depth or sequencing.
60–74: Mixed; several missed opportunities.
<60: Needs practice; focus on fundamentals in next_skill.

Constraints
Be specific. Avoid generic advice.
Do not quote excessively; reference content briefly.
If data is missing or ambiguous, state it in summary and proceed with best-effort evaluation.`;

    console.log('[Evaluation API] Sending request to Gemini...');
    const result = await model.generateContent(systemPrompt + '\n\n' + userPrompt);
    const response = await result.response;
    const evaluationText = response.text();

    console.log('[Evaluation API] Raw response:', evaluationText.substring(0, 500));

    // Parse the JSON response
    try {
      // Clean the response text to extract only JSON
      const jsonMatch = evaluationText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : evaluationText;
      
      const evaluation = JSON.parse(jsonText);
      console.log('[Evaluation API] Parsed evaluation successfully');
      return NextResponse.json(evaluation);
    } catch (parseError) {
      console.error('Failed to parse evaluation JSON:', parseError);
      console.error('Raw response text:', evaluationText);
      return NextResponse.json(
        { error: 'Failed to parse evaluation response', rawResponse: evaluationText },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to generate evaluation' },
      { status: 500 }
    );
  }
}
