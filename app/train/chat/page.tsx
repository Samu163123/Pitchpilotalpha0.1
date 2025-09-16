"use client"

import { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation'
import SidePanel from '@/components/side-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpeechToTextButton } from '@/components/speech-to-text-button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Wand2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSetupSelectionStore } from '@/lib/store';
import { useBuyerPersonaDraftStore } from '@/lib/store';
import { useScenarioStore, useCallStore } from '@/lib/store';
import { useLanguageStore } from '@/lib/store';

export default function ChatPage() {
  const searchParams = useSearchParams()
  const isFresh = (searchParams?.get('fresh') === '1')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const speakEnabled = !isMuted;
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { selectedProduct } = useSetupSelectionStore();
  const { draft: personaDraft } = useBuyerPersonaDraftStore();
  const { scenario } = useScenarioStore();
  const { hintsEnabled, setHintsEnabled, sessionId: storeSessionId } = useCallStore();
  const language = useLanguageStore((s) => s.language);

  // Sentence improver interop with SidePanel
  const [improverText, setImproverText] = useState<string>('')
  const [improverTrigger, setImproverTrigger] = useState<number>(0)

  const [mounted, setMounted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inProgressSessions, setInProgressSessions] = useState<Array<{ session_id: string; updated_at: string }>>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);
  const [resumeChecked, setResumeChecked] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [saveOnClose, setSaveOnClose] = useState<boolean>(true);
  const [decisionPending, setDecisionPending] = useState<null | 'accepted' | 'declined'>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);

  // Hydration guard: render only after client mounts to avoid SSR/client mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Trigger evaluation when the user clicks Continue on the decision modal
  const handleEvaluateAndContinue = async () => {
    if (!decisionPending) return;
    setEvaluationLoading(true);
    try {
      const payload = {
        transcript: messages,
        product: apiProduct,
        persona: apiPersona,
        scenario: scenario,
        decision: decisionPending,
        sessionId: sessionId || Date.now().toString(),
      };

  // If explicitly requested via query param, start a fresh chat immediately on mount
  useEffect(() => {
    if (isFresh) {
      startNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFresh])
      // Persist payload for fallback use on evaluation page
      try { localStorage.setItem('evaluationData', JSON.stringify(payload)); } catch {}

      const resp = await fetch('/api/evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        const result = await resp.json();
        try { localStorage.setItem('evaluationResult', JSON.stringify(result)); } catch {}
      }
      // After kicking evaluation, clear local session id so next chat is fresh
      try { localStorage.removeItem('chatSessionId'); } catch {}
      // Navigate to evaluation page
      navigateToEvaluation(decisionPending);
    } catch (e) {
      console.error('Evaluation request failed; navigating with payload fallback', e);
      navigateToEvaluation(decisionPending);
    } finally {
      setEvaluationLoading(false);
    }
  };

  // Session management: prefer sessionId from store (set during Setup) over any localStorage value.
  // This ensures a brand-new session starts fresh without resuming old chat logs.
  useEffect(() => {
    if (!mounted) return;
    try {
      const key = 'chatSessionId';
      // If Setup provided a fresh session id, use it and persist to localStorage
      if (storeSessionId) {
        localStorage.setItem(key, storeSessionId);
        setSessionId(storeSessionId);
        return;
      }
      // Fallback: load or create a session id from localStorage
      let sid: string | null = localStorage.getItem(key);
      if (!sid) {
        sid = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
          ? (crypto as any).randomUUID()
          : String(Date.now());
        localStorage.setItem(key, sid as string);
      }
      setSessionId(sid as string);
    } catch (e) {
      console.error('Failed establishing sessionId', e);
      setSessionId(String(Date.now()));
    }
  }, [mounted, storeSessionId]);

  // Resume session if it exists on server
  useEffect(() => {
    (async () => {
      if (isFresh) return; // skip resume when a fresh chat is requested
      if (!sessionId) return;
      try {
        console.debug('[Session] Resume request', { sessionId });
        const resp = await fetch(`/api/chat-session/${encodeURIComponent(sessionId)}`);
        if (resp.ok) {
          const data = await resp.json();
          const s = data?.session;
          if (s?.messages && Array.isArray(s.messages) && s.messages.length > 0) {
            setMessages(s.messages);
            setResumeChecked(true);
            return;
          }
        } else {
          const errTxt = await resp.text().catch(() => '');
          if (resp.status === 404) {
            console.debug('[Session] No server session found (expected for first-time).');
          } else if (resp.status === 401) {
            console.warn('[Session] Resume unauthorized (401). User may need to sign in again.');
          } else {
            console.error('[Session] Resume failed', { status: resp.status, body: errTxt });
          }
        }
        // Fallback: try local backup if server has no data
        try {
          const raw = localStorage.getItem(`chatSessionLocal:${sessionId}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed?.messages) && parsed.messages.length > 0) {
              console.debug('[Session] Resuming from local backup');
              setMessages(parsed.messages);
              setResumeChecked(true);
              return;
            }
          }
        } catch {}
      } catch (e) {
        console.warn('No existing session to resume or failed to fetch', e);
        // Try local fallback on error as well
        try {
          const raw = localStorage.getItem(`chatSessionLocal:${sessionId}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed?.messages) && parsed.messages.length > 0) {
              console.debug('[Session] Resuming from local backup after error');
              setMessages(parsed.messages);
              setResumeChecked(true);
              return;
            }
          }
        } catch {}
      }
      setResumeChecked(true);
    })();
  }, [sessionId]);

  // Removed resume dropdown/list to simplify UI

  // Helper: persist session state (debounced by React batching naturally)
  const persistSession = async (status: 'in_progress' | 'completed' = 'in_progress', outcome?: 'accepted' | 'declined' | null) => {
    try {
      if (!sessionId) return;
      const payload = {
        sessionId,
        messages,
        status,
        outcome: typeof outcome === 'string' ? outcome : null,
        product: apiProduct ?? null,
        persona: apiPersona ?? null,
        scenarioSettings,
      };
      console.debug('[Session] Persist begin', { sessionId, status, messagesCount: messages.length });
      const resp = await fetch('/api/chat-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        console.error('Failed to persist session', txt, 'status', resp.status);
        // Local backup on failure
        try {
          localStorage.setItem(`chatSessionLocal:${sessionId}`, JSON.stringify({ ...payload, updatedAt: new Date().toISOString() }));
        } catch {}
      } else {
        // On success, also keep a lightweight local copy
        try {
          localStorage.setItem(`chatSessionLocal:${sessionId}`, JSON.stringify({ ...payload, updatedAt: new Date().toISOString() }));
        } catch {}
      }
    } catch (e) {
      console.error('Persist session error', e);
      // Local backup on exception
      try {
        if (sessionId) {
          const payload = {
            sessionId,
            messages,
            status,
            outcome: typeof outcome === 'string' ? outcome : null,
            product: apiProduct ?? null,
            persona: apiPersona ?? null,
            scenarioSettings,
          };
          localStorage.setItem(`chatSessionLocal:${sessionId}`, JSON.stringify({ ...payload, updatedAt: new Date().toISOString() }));
        }
      } catch {}
    }
  };

  // Start a brand-new chat session: clears messages and sets a fresh sessionId
  const startNewChat = () => {
    try {
      // Stop current audio if any
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = "";
        currentAudioRef.current = null;
      }
    } catch {}
    try {
      const newId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
        ? (crypto as any).randomUUID()
        : String(Date.now());
      localStorage.setItem('chatSessionId', newId);
      setSessionId(newId);
    } catch {
      // if localStorage fails, still proceed with in-memory reset
      setSessionId(String(Date.now()));
    }
    // Clear current conversation state
    setMessages([]);
    setResumeChecked(true); // allow auto-greeting when prerequisites are ready
    setSelectedResumeId(undefined);
  };

  // Beacon-based persist for page unload/visibility loss
  const persistSessionBeacon = (status: 'in_progress' | 'completed' = 'in_progress', outcome?: 'accepted' | 'declined' | null) => {
    try {
      if (!sessionId) return;
      const payload = {
        sessionId,
        messages,
        status,
        outcome: typeof outcome === 'string' ? outcome : null,
        product: apiProduct ?? null,
        persona: apiPersona ?? null,
        scenarioSettings,
      };
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const ok = navigator.sendBeacon('/api/chat-session', blob);
      if (!ok) {
        // Fallback: keepalive fetch in browsers that support it
        try {
          fetch('/api/chat-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(() => {});
        } catch {}
      }
      // Always keep a local backup
      try {
        localStorage.setItem(`chatSessionLocal:${sessionId}`, JSON.stringify({ ...payload, updatedAt: new Date().toISOString() }));
      } catch {}
    } catch {}
  };

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
    callType: scenario?.callType ? {
      id: (scenario as any).callType.id,
      name: (scenario as any).callType.name,
      description: (scenario as any).callType.description ?? '',
      goal: (scenario as any).callType.goal ?? '',
    } : null,
  }), [difficulty, brief, timeRemaining, scenario]);

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

  // Prerequisites: require both product and persona for chat API
  const prerequisitesOk = useMemo(() => !!apiProduct && !!apiPersona, [apiProduct, apiPersona]);
  const missingPrereqs = useMemo(() => {
    const items: string[] = [];
    if (!apiProduct) items.push('Product');
    if (!apiPersona) items.push('Buyer Persona');
    return items;
  }, [apiProduct, apiPersona]);

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
    // cancel any in-flight request first
    try { currentControllerRef.current?.abort(); } catch {}
    const controller = new AbortController();
    currentControllerRef.current = controller;
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: outgoingMessages,
        product: apiProduct,
        persona: apiPersona,
        scenarioSettings,
        language,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Error fetching chat response');
    return response.json();
  };

  // Helper: call our OpenAI TTS API and play the audio
  const speakWithOpenAITTS = async (text: string, format: 'mp3' | 'wav' | 'flac' | 'opus' | 'aac' | 'pcm' = 'opus') => {
    try {
      const t0 = performance.now();
      console.debug('[TTS] Request start', { length: text.length, muted: isMuted, format });
      // cancel previous playback
      if (currentAudioRef.current) {
        console.debug('[TTS] Stopping previous audio');
        currentAudioRef.current.pause();
        currentAudioRef.current.src = "";
        currentAudioRef.current = null;
      }

      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'alloy', format }),
      });
      console.debug('[TTS] Response status', resp.status, resp.statusText);
      if (!resp.ok) {
        const errText = await resp.text();
        console.error('[TTS] Error response body:', errText);
        return;
      }
      const blob = await resp.blob();
      const t1 = performance.now();
      console.debug('[TTS] Blob size (bytes)', blob.size, 'type', blob.type, 'latencyMs', Math.round(t1 - t0));
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      audio.onerror = (ev) => {
        console.error('[TTS] Audio element error', ev);
      };
      audio.onended = () => {
        try { URL.revokeObjectURL(url); } catch {}
        if (currentAudioRef.current === audio) currentAudioRef.current = null;
      };
      const playPromise = audio.play();
      if (playPromise) {
        await playPromise.then(() => console.debug('[TTS] Playback started')).catch((e) => {
          console.error('[TTS] Playback failed', e);
        });
      }
    } catch (err) {
      console.error('[TTS] Failed to play TTS:', err);
    }
  };

  // Auto-start conversation with empty user message to get greeting
  useEffect(() => {
    if (!resumeChecked) return; // ensure we've checked resume before auto-start
    if (messages.length === 0 && apiProduct && apiPersona) {
      (async () => {
        setLoading(true);
        try {
          const data = await callAPI([]);
          const reply: string = data.reply ?? '';
          applyTimeAddFromReply(reply);
          if (speakEnabled && reply) {
            await speakWithOpenAITTS(reply, 'opus');
          }
          setMessages([{ role: 'assistant' as const, content: reply }]);
          // Persist the starting state
          try { await persistSession('in_progress', null); } catch {}
        } catch (e) {
          if ((e as any)?.name === 'AbortError') {
            console.debug('Initial greet aborted');
          } else {
            console.error('Failed to start conversation', e);
          }
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [apiProduct, apiPersona, resumeChecked]);

  const detectDecision = (text: string) => {
    const decisionMatch = text.match(/\{"decision":\s*"(accepted|declined)"\}/);
    if (decisionMatch) {
      return {
        decision: decisionMatch[1] as 'accepted' | 'declined',
        cleanedText: text.replace(/\{"decision":\s*"(accepted|declined)"\}/, '').trim(),
      };
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    if (!prerequisitesOk) {
      console.warn('Cannot send message: select a product and persona first.');
      return;
    }

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
      const textToRender = decisionResult?.cleanedText || reply;
      applyTimeAddFromReply(reply);
      // If speaking is enabled, start audio first, then render text when playback begins
      if (speakEnabled && textToRender) {
        await speakWithOpenAITTS(textToRender, 'opus');
        setMessages((prev) => [...prev, { role: 'assistant' as const, content: textToRender }]);
      } else {
        // If muted or no text, render immediately
        setMessages((prev) => [...prev, { role: 'assistant' as const, content: textToRender }]);
      }
      // After rendering, handle decision navigation if present
      if (decisionResult) {
        // Mark session as completed with outcome
        try { await persistSession('completed', decisionResult.decision); } catch {}
        // Show decision modal; evaluation will be triggered on Continue
        setDecisionPending(decisionResult.decision);
      }
      // Persist in-progress after appending assistant
      try { await persistSession('in_progress', null); } catch {}
    } catch (error) {
      if ((error as any)?.name === 'AbortError') {
        console.debug('Chat request aborted by user');
      } else {
        console.error('Error in chat:', error);
      }
    } finally {
      setLoading(false);
    }
  };

// ... (rest of the code remains the same)

  // Autosave whenever messages change (and after initial mount/setup). Lightweight protection against data loss
  useEffect(() => {
    if (!sessionId) return;
    if (messages.length === 0) return;
    persistSession('in_progress', null);
  }, [messages, sessionId]);

  // Stop any ongoing TTS playback when this component unmounts (e.g., user navigates away)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        try {
          if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.src = "";
            currentAudioRef.current = null;
          }
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      try {
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current.src = "";
          currentAudioRef.current = null;
        }
      } catch {}
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
  <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8 max-w-6xl mx-auto">
    <div className="w-full md:w-2/3">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>Sales Call Simulation</CardTitle>
          <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
            {apiProduct?.name && (
              <span className="ml-0 font-medium text-foreground">Product: {apiProduct.name}</span>
            )}
            <span>Difficulty: {String(difficulty).toUpperCase()}</span>
            {timeRemaining != null && (
              <span className="ml-3">Time: {timeRemaining}s</span>
            )}
            {scenario?.callType && (
              <span className="ml-3">Call Type: {scenario.callType.name}</span>
            )}
            <span className="ml-3 flex items-center gap-2">
              <span>Mute</span>
              <Switch checked={isMuted} onCheckedChange={setIsMuted} />
            </span>
            <span className="ml-3 flex items-center gap-2">
              <span>Save on close</span>
              <Switch checked={saveOnClose} onCheckedChange={setSaveOnClose} />
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {!prerequisitesOk && (
            <div className="mb-4 text-sm text-muted-foreground bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded p-3">
              <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">Setup required</div>
              <div>
                Please complete the following before chatting: <span className="font-medium">{missingPrereqs.join(' and ')}</span>.
                Go to <span className="font-medium">Train → Setup</span> (product) and <span className="font-medium">Train → Persona</span>, then return here.
              </div>
            </div>
          )}
          <div className="space-y-4 h-96 overflow-y-auto p-4 border rounded-md">
            {/* Coach tips removed per request */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`p-2 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground cursor-pointer' : 'bg-secondary'}`}
                  title={msg.role === 'user' ? 'Click to edit this message' : undefined}
                  onClick={() => {
                    if (msg.role !== 'user') return;
                    setInput(msg.content);
                    try { inputRef.current?.focus(); } catch {}
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder={prerequisitesOk ? "Type your message... (tip: try BUY to close)" : "Select a product and persona to start chatting"}
              disabled={
                loading ||
                (timeRemaining != null && timeRemaining <= 0) ||
                !prerequisitesOk ||
                // Block input at challenge start until first assistant message arrives
                (resumeChecked && messages.findIndex(m => m.role === 'assistant') === -1)
              }
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      const src = input.trim()
                      if (!src) return
                      const wc = src.split(/\s+/).filter(Boolean).length
                      if (wc < 5) return
                      setImproverText(src)
                      setImproverTrigger((n) => n + 1)
                    }}
                    disabled={
                      loading ||
                      (timeRemaining != null && timeRemaining <= 0) ||
                      !prerequisitesOk ||
                      // Also block Improve until first assistant message
                      (resumeChecked && messages.findIndex(m => m.role === 'assistant') === -1) ||
                      (input.trim().split(/\s+/).filter(Boolean).length < 5)
                    }
                    className="h-10 w-10 p-0"
                    aria-label="AI Improve"
                    title="AI Improve"
                  >
                    <Wand2 className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Improve sentence (5+ words). Adds tips and rewrite in side panel.</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <SpeechToTextButton
              onTranscript={(t) => setInput((prev) => prev ? `${prev} ${t}` : t)}
              disabled={loading || (timeRemaining != null && timeRemaining <= 0) || !prerequisitesOk}
            />
            {loading ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  try { currentControllerRef.current?.abort(); } catch {}
                  // Restore last user message to input for editing
                  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                  if (lastUser) setInput(lastUser.content);
                  try { inputRef.current?.focus(); } catch {}
                }}
              >
                Stop
              </Button>
            ) : (
              <Button onClick={handleSendMessage} disabled={loading || (timeRemaining != null && timeRemaining <= 0) || !prerequisitesOk}>
                Send
              </Button>
            )}
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
        improverText={improverText}
        improverTrigger={improverTrigger}
        callType={scenario?.callType || null}
      />
    </div>
    {/* Decision modal */}
    <AlertDialog open={!!decisionPending} onOpenChange={(open) => { if (!open) setDecisionPending(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {decisionPending === 'accepted' ? 'You won! 🎉' : 'You lost this one'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {decisionPending === 'accepted'
              ? 'You persuaded the buyer. Continue to get an immediate skill-by-skill evaluation.'
              : 'The buyer declined. Continue to get targeted coaching feedback.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={evaluationLoading} onClick={() => setDecisionPending(null)}>Close</AlertDialogCancel>
          <AlertDialogAction disabled={evaluationLoading} onClick={handleEvaluateAndContinue}>
            {evaluationLoading ? 'Evaluating…' : 'Continue'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
}

// Ensure TTS audio stops when component unmounts (e.g., navigating to Challenges)
// This hook must be outside of the component body in this file's structure, so ensure the cleanup exists within ChatPage.
