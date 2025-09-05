"use client"

import { useEffect, useMemo, useState, useRef } from 'react';
import SidePanel from '@/components/side-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSetupSelectionStore } from '@/lib/store';
import { useBuyerPersonaDraftStore } from '@/lib/store';
import { useScenarioStore, useCallStore } from '@/lib/store';

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [speakEnabled, setSpeakEnabled] = useState<boolean>(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { selectedProduct } = useSetupSelectionStore();
  const { draft: personaDraft } = useBuyerPersonaDraftStore();
  const { scenario } = useScenarioStore();
  const { hintsEnabled, setHintsEnabled } = useCallStore();
  const [mounted, setMounted] = useState(false);

  // Hydration guard: render only after client mounts to avoid SSR/client mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Build the scenario brief from scenario or persona draft (fallback)
  const brief = useMemo(() => ({
    background: (scenario?.brief as any)?.background ?? (personaDraft?.background ?? ''),
    pains: (scenario?.brief as any)?.pains ?? (personaDraft?.painPoints ?? ''),
    mindset: (scenario?.brief as any)?.mindset ?? (personaDraft?.mindset ?? ''),
  }), [scenario, personaDraft]);

  const scenarioSettings = useMemo(() => ({
    difficulty,
    brief,
    timeLimitSec: timeRemaining,
  }), [difficulty, brief, timeRemaining]);

  // Initialize from scenario when available (normalize difficulty to string)
  useEffect(() => {
    if (scenario) {
      if (scenario.timeLimitSec != null) setTimeRemaining(scenario.timeLimitSec as number);
      if ((scenario as any).difficulty) {
        const d: any = (scenario as any).difficulty;
        const raw = typeof d === 'string' ? d : (d.level ?? d.name ?? '').toString().toLowerCase();
        const normalized = ['easy', 'medium', 'hard'].includes(raw) ? (raw as 'easy' | 'medium' | 'hard') : 'medium';
        setDifficulty(normalized);
      }
    }
    // If no scenario or no time, keep null (unlimited) and let countdown effect handle it
  }, [scenario]);

  // Compute product/persona for API
  const apiProduct = useMemo(() => scenario?.product ?? selectedProduct, [scenario, selectedProduct]);
  const apiPersona = useMemo(() => {
    if (scenario?.persona && typeof scenario.persona === 'object') {
      const p: any = scenario.persona as any;
      return {
        personaName: p.name ?? p.personaName ?? 'Buyer',
        background: p.background ?? '',
        painPoints: p.pains ?? p.painPoints ?? '',
        mindset: p.mindset ?? '',
      };
    }
    if (personaDraft) {
      return {
        personaName: personaDraft.personaName,
        background: personaDraft.background,
        painPoints: personaDraft.painPoints,
        mindset: personaDraft.mindset,
      };
    }
    return null;
  }, [scenario, personaDraft]);

  // Parse [add: X] or ADD +X and update timer
  const applyTimeAddFromReply = (reply: string) => {
    if (timeRemaining == null) return;
    let add = 0;
    const bracketMatch = reply.match(/\[add:\s*(\d+)\]/i);
    const addMatch = reply.match(/\bADD\s*\+\s*(\d+)\b/i);
    if (bracketMatch) add = parseInt(bracketMatch[1], 10);
    else if (addMatch) add = parseInt(addMatch[1], 10);
    if (!Number.isNaN(add) && add > 0) setTimeRemaining((t) => (t == null ? t : t + add));
  };

  // Optional: countdown tick if timer active
  useEffect(() => {
    if (timeRemaining == null) return;
    const id = setInterval(() => {
      setTimeRemaining((t) => (t == null ? t : Math.max(0, t - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, [timeRemaining != null]);

  const callAPI = async (outgoingMessages: { role: 'user' | 'assistant'; content: string }[]) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: outgoingMessages,
        product: apiProduct,
        persona: apiPersona,
        scenarioSettings,
      }),
    });
    if (!response.ok) throw new Error('Error fetching chat response');
    return response.json();
  };

  const detectDecision = (text: string) => {
    const decisionMatch = text.match(/\{"decision":\s*"(accepted|declined)"\}/);
    if (decisionMatch) {
      return {
        decision: decisionMatch[1] as 'accepted' | 'declined',
        cleanedText: text.replace(/\{"decision":\s*"(accepted|declined)"\}/, '').trim()
      };
    }
    return null;
  };

  const navigateToEvaluation = (decision: 'accepted' | 'declined') => {
    // Store evaluation data in localStorage for the evaluation page
    const evaluationData = {
      transcript: messages,
      product: apiProduct,
      persona: apiPersona,
      scenario: scenario,
      decision: decision,
      sessionId: Date.now().toString()
    };
    localStorage.setItem('evaluationData', JSON.stringify(evaluationData));
    window.location.href = '/train/evaluation';
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // BUY ends the call early from user side; still send to let model close
    const content = input.trim();
    const newMessages = [...messages, { role: 'user' as const, content }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const data = await callAPI(newMessages);
      const reply: string = data.reply ?? '';
      
      // Check for decision and filter it out
      const decisionResult = detectDecision(reply);
      if (decisionResult) {
        // Display cleaned message without decision JSON
        setMessages((prev) => [...prev, { role: 'assistant' as const, content: decisionResult.cleanedText }]);
        // Navigate to evaluation after a short delay
        setTimeout(() => navigateToEvaluation(decisionResult.decision), 1000);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant' as const, content: reply }]);
      }
      
      applyTimeAddFromReply(reply);
      // Speak reply if enabled
      if (speakEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          if (speechUtteranceRef.current) {
            window.speechSynthesis.cancel();
          }
          const utt = new SpeechSynthesisUtterance(decisionResult?.cleanedText || reply);
          speechUtteranceRef.current = utt;
          window.speechSynthesis.speak(utt);
        } catch {}
      }
    } catch (error) {
      console.error('Error in chat:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-start conversation with empty user message to get greeting
  useEffect(() => {
    if (messages.length === 0 && apiProduct && apiPersona) {
      (async () => {
        setLoading(true);
        try {
          const data = await callAPI([]);
          const reply: string = data.reply ?? '';
          setMessages([{ role: 'assistant' as const, content: reply }]);
          applyTimeAddFromReply(reply);
          if (speakEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try {
              const utt = new SpeechSynthesisUtterance(reply);
              speechUtteranceRef.current = utt;
              window.speechSynthesis.speak(utt);
            } catch {}
          }
        } catch (e) {
          console.error('Failed to start conversation', e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [apiProduct, apiPersona]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const difficultyDisplay = useMemo(() => {
    const d: any = difficulty;
    const str = typeof d === 'string' ? d : (d?.level ?? d?.name ?? 'medium');
    return String(str).toUpperCase();
  }, [difficulty]);

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8 max-w-6xl mx-auto">
      {!mounted ? (
        <div />
      ) : (
        <>
        <div className="w-full md:w-2/3">
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle>Sales Call Simulation</CardTitle>
            <div className="text-sm text-muted-foreground">
              <span>Difficulty: {difficultyDisplay}</span>
              {timeRemaining != null && (
                <span className="ml-3">Time: {timeRemaining}s</span>
              )}
              {scenario?.callType && (
                <span className="ml-3">Call Type: {scenario.callType.name}</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 h-96 overflow-y-auto p-4 border rounded-md">
              {hintsEnabled && (
                <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded p-3">
                  <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">Coach tips</div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Open with a clear value statement tailored to the buyer.</li>
                    <li>Ask one targeted question before pitching features.</li>
                    <li>Handle an objection, then confirm next step.</li>
                  </ul>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type your message... (tip: try BUY to close)"
                disabled={loading || (timeRemaining != null && timeRemaining <= 0)}
              />
              <Button onClick={handleSendMessage} disabled={loading || (timeRemaining != null && timeRemaining <= 0)}>
                {loading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="w-full md:w-1/3">
        <SidePanel 
          messages={messages} 
          product={apiProduct} 
          persona={apiPersona} 
          onPasteToInput={(text) => setInput(text)}
        />
      </div>
      </>
      )}
    </div>
  );
}
