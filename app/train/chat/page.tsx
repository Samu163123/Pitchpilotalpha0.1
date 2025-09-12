"use client"

import { useEffect, useMemo, useState, useRef } from 'react';
import SidePanel from '@/components/side-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpeechToTextButton } from '@/components/speech-to-text-button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSetupSelectionStore } from '@/lib/store';
import { useBuyerPersonaDraftStore } from '@/lib/store';
import { useScenarioStore, useCallStore } from '@/lib/store';

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const speakEnabled = !isMuted;
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const { selectedProduct } = useSetupSelectionStore();
  const { draft: personaDraft } = useBuyerPersonaDraftStore();
  const { scenario } = useScenarioStore();
  const { hintsEnabled, setHintsEnabled } = useCallStore();
  const [mounted, setMounted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inProgressSessions, setInProgressSessions] = useState<Array<{ session_id: string; updated_at: string }>>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);
  const [resumeChecked, setResumeChecked] = useState(false);

  // Hydration guard: render only after client mounts to avoid SSR/client mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Session management: create or load sessionId from localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      const key = 'chatSessionId';
      let sid: string | null = localStorage.getItem(key);
      if (!sid) {
        sid = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : String(Date.now());
        localStorage.setItem(key, sid as string);
      }
      setSessionId(sid as string);
    } catch (e) {
      console.error('Failed establishing sessionId', e);
      setSessionId(String(Date.now()));
    }
  }, [mounted]);

  // Resume session if it exists on server
  useEffect(() => {
    (async () => {
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
          console.error('[Session] Resume failed', { status: resp.status, body: errTxt });
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

  // Load list of in-progress sessions for quick resume UI
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/chat-session?status=in_progress', { cache: 'no-store' });
        if (!resp.ok) {
          const body = await resp.text().catch(() => '');
          console.error('[Session] List in-progress failed', { status: resp.status, body });
          return;
        }
        const data = await resp.json();
        const items = (data?.sessions ?? []).map((s: any) => ({ session_id: s.session_id as string, updated_at: s.updated_at as string }));
        // Merge local backups that may not exist on server
        let localItems: Array<{ session_id: string; updated_at: string }> = [];
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i) as string;
            if (!k) continue;
            if (k.startsWith('chatSessionLocal:')) {
              const sid = k.replace('chatSessionLocal:', '');
              const raw = localStorage.getItem(k);
              const parsed = raw ? JSON.parse(raw) : null;
              const updated_at = parsed?.updatedAt || new Date().toISOString();
              localItems.push({ session_id: sid, updated_at });
            }
          }
        } catch {}
        // Deduplicate by session_id keeping most recent updated_at
        const mergedMap = new Map<string, string>();
        [...items, ...localItems].forEach((it) => {
          const prev = mergedMap.get(it.session_id);
          if (!prev || new Date(it.updated_at) > new Date(prev)) {
            mergedMap.set(it.session_id, it.updated_at);
          }
        });
        const merged = Array.from(mergedMap.entries()).map(([session_id, updated_at]) => ({ session_id, updated_at }));
        // Sort desc by updated_at
        merged.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        setInProgressSessions(merged);
      } catch (e) {
        // non-blocking
      }
    })();
  }, [mounted]);

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
        // Clear local session id so a new chat starts next time
        try { localStorage.removeItem('chatSessionId'); } catch {}
        setTimeout(() => navigateToEvaluation(decisionResult.decision), 1000);
      }
      // Persist in-progress after appending assistant
      try { await persistSession('in_progress', null); } catch {}
    } catch (error) {
      console.error('Error in chat:', error);
    } finally {
      setLoading(false);
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
          console.error('Failed to start conversation', e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [apiProduct, apiPersona, resumeChecked]);

  // Autosave whenever messages change (and after initial mount/setup). Lightweight protection against data loss
  useEffect(() => {
    if (!sessionId) return;
    if (messages.length === 0) return;
    persistSession('in_progress', null);
  }, [messages, sessionId]);

  // On unload, persist current session to allow resuming later
  useEffect(() => {
    const onBeforeUnload = () => {
      if (messages.length > 0) {
        persistSessionBeacon('in_progress', null);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && messages.length > 0) {
        persistSessionBeacon('in_progress', null);
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [messages, sessionId, apiProduct, apiPersona]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      // Stop any current audio
      try {
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current.src = "";
          currentAudioRef.current = null;
        }
      } catch {}
    };
  }, []);

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

  const difficultyDisplay = useMemo(() => {
    const d: any = difficulty;
    const str = typeof d === 'string' ? d : (d?.level ?? d?.name ?? 'medium');
    return String(str).toUpperCase();
  }, [difficulty]);

  // Handle speech-to-text transcript
  const handleSpeechTranscript = (transcript: string) => {
    setInput(prev => {
      const newValue = prev ? `${prev} ${transcript}` : transcript;
      return newValue;
    });
  };

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
            <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
              <span>Difficulty: {difficultyDisplay}</span>
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
              <div className="ml-3 flex items-center gap-2">
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Continue previous chat" />
                  </SelectTrigger>
                  <SelectContent>
                    {inProgressSessions.length === 0 ? (
                      <SelectItem value="no-items" disabled>No in-progress chats</SelectItem>
                    ) : (
                      inProgressSessions.map((s) => (
                        <SelectItem key={s.session_id} value={s.session_id}>
                          {s.session_id.slice(0, 8)} · {new Date(s.updated_at).toLocaleString()}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    if (!selectedResumeId) return;
                    try {
                      // selectedResumeId is guaranteed by the guard above
                      localStorage.setItem('chatSessionId', selectedResumeId as string);
                      setSessionId(selectedResumeId);
                      // Fetch and set messages immediately for snappy UX
                      const resp = await fetch(`/api/chat-session/${encodeURIComponent(selectedResumeId)}`, { cache: 'no-store' });
                      if (resp.ok) {
                        const data = await resp.json();
                        const s = data?.session;
                        if (s?.messages && Array.isArray(s.messages)) {
                          setMessages(s.messages);
                        }
                      }
                    } catch (e) {
                      console.error('Failed to resume session', e);
                    }
                  }}
                >
                  Load
                </Button>
              </div>
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
              <SpeechToTextButton
                onTranscript={handleSpeechTranscript}
                disabled={loading || (timeRemaining != null && timeRemaining <= 0)}
              />
              <Button onClick={handleSendMessage} disabled={loading || (timeRemaining != null && timeRemaining <= 0)}>
                {loading ? 'Sending...' : 'Send'}
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await persistSession('in_progress', null);
                  } catch (e) {
                    console.error('Save & Exit failed to persist', e);
                  } finally {
                    window.location.href = '/history';
                  }
                }}
                disabled={loading}
              >
                Save & Exit
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
