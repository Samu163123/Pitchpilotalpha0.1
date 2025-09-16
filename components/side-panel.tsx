"use client"

import { useState } from 'react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface SidePanelProps {
  messages: { role: 'user' | 'assistant'; content: string }[];
  product: any;
  persona: any;
  onPasteToInput: (text: string) => void;
  improverText?: string;
  improverTrigger?: number; // when incremented, runs improver with improverText
  callType?: any | null;
}

const SidePanel = ({ messages, product, persona, onPasteToInput, improverText, improverTrigger, callType }: SidePanelProps) => {
  const [activeTab, setActiveTab] = useState('coach');
  const [notes, setNotes] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesInitialized, setNotesInitialized] = useState(false);
  const [lastProcessedIndex, setLastProcessedIndex] = useState<number>(-1); // index in messages array
  type SuggestionPair = { head: string; ex?: string };
  const [suggestions, setSuggestions] = useState<SuggestionPair[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  // Improver state
  const [improverLoading, setImproverLoading] = useState(false);
  const [improverData, setImproverData] = useState<{ problems: string[]; suggestions: string[]; rewritten: string } | null>(null);
  const [improverHistory, setImproverHistory] = useState<Array<{ problems: string[]; suggestions: string[]; rewritten: string; original?: string; ts: string }>>([])
  const [improverTab, setImproverTab] = useState<'current' | 'history'>('current')

  // Helper: call improver API
  const runImprover = async (text: string) => {
    setImproverLoading(true);
    try {
      const resp = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          product,
          persona,
          callType,
          chatlog: messages,
          notes,
        }),
      });
      if (!resp.ok) throw new Error('Improve request failed');
      const data = await resp.json();
      const result = data?.result as { problems?: string[]; suggestions?: string[]; rewritten?: string };
      // Push previous improvement to history before showing the new one
      if (improverData && (improverData.problems.length || improverData.suggestions.length || improverData.rewritten)) {
        setImproverHistory((h) => [{ ...improverData, original: text, ts: new Date().toISOString() }, ...h].slice(0, 20))
      }
      setImproverData({
        problems: Array.isArray(result?.problems) ? result.problems : [],
        suggestions: Array.isArray(result?.suggestions) ? result.suggestions : [],
        rewritten: typeof result?.rewritten === 'string' ? result.rewritten : '',
      });
      setActiveTab('improver');
      setImproverTab('current')
    } catch (e) {
      console.error('[SidePanel] improve error', e);
      setImproverData({ problems: ['Unable to analyze sentence. Try again.'], suggestions: [], rewritten: '' });
      setActiveTab('improver');
      setImproverTab('current')
    } finally {
      setImproverLoading(false);
    }
  };

  // React to improver trigger from parent
  React.useEffect(() => {
    if (typeof improverTrigger === 'number' && improverTrigger > 0 && improverText && improverText.trim()) {
      runImprover(improverText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [improverTrigger]);

  // Auto-note taking for key buyer statements
  const extractKeyBuyerInfo = (content: string) => {
    const patterns = [
      // Budget/Cost patterns
      { regex: /(?:budget|cost|price|expensive|cheap|afford).{0,50}/gi, category: 'Budget', icon: '💰' },
      { regex: /(?:can't afford|too expensive|out of budget|budget constraints).{0,30}/gi, category: 'Budget', icon: '💰' },
      
      // Decision making patterns
      { regex: /(?:need to|have to|will|going to).{0,40}(?:decide|think about|consider|evaluate)/gi, category: 'Decision', icon: '🤔' },
      { regex: /(?:decision|decide).{0,40}(?:by|before|within|next week|next month)/gi, category: 'Timeline', icon: '⏰' },
      
      // Objections patterns
      { regex: /(?:concern|worried|issue|problem|challenge).{0,50}/gi, category: 'Concern', icon: '⚠️' },
      { regex: /(?:but|however|although|not sure).{0,60}/gi, category: 'Objection', icon: '❌' },
      
      // Preferences patterns
      { regex: /(?:prefer|like|want|need|require).{0,50}/gi, category: 'Preference', icon: '✨' },
      { regex: /(?:looking for|interested in|need something).{0,50}/gi, category: 'Requirement', icon: '🎯' },
      
      // Timeline patterns
      { regex: /(?:timeline|when|deadline|urgency|soon|asap|immediately).{0,40}/gi, category: 'Timeline', icon: '⏰' },
      { regex: /(?:by|before|within|next).{0,20}(?:week|month|quarter|year)/gi, category: 'Timeline', icon: '⏰' },
      
      // Competitor patterns
      { regex: /(?:competitor|alternative|other option|comparison|currently using).{0,50}/gi, category: 'Competition', icon: '🏢' },
      { regex: /(?:compared to|versus|better than).{0,40}/gi, category: 'Competition', icon: '🏢' },
      
      // Authority patterns
      { regex: /(?:boss|manager|team|board|approval).{0,40}/gi, category: 'Authority', icon: '👥' },
      { regex: /(?:need approval|check with|discuss with).{0,40}/gi, category: 'Authority', icon: '👥' }
    ];
    
    type BuyerNote = { text: string; category: string; icon: string; timestamp: string };
    const matches: BuyerNote[] = [];
    for (const pattern of patterns) {
      const found = content.match(pattern.regex);
      if (found) {
        found.forEach(match => {
          matches.push({
            text: match.trim(),
            category: pattern.category,
            icon: pattern.icon,
            timestamp: new Date().toLocaleTimeString()
          });
        });
      }
    }
    
    return matches;
  };

  // Monitor messages for key buyer statements
  React.useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        const snippets = extractKeyBuyerInfo(lastMessage.content);
        if (snippets.length > 0) {
          const newNotes = snippets.map(snippet => 
            `${snippet.icon} **${snippet.category}** (${snippet.timestamp})\n"${snippet.text}"`
          ).join('\n\n');
          
          setNotes(prev => prev ? `${prev}\n\n${newNotes}` : newNotes);
        }
      }
    }
  }, [messages]);

  // Helper: count assistant (buyer) messages in a slice
  const countAssistantMessages = (from: number, to: number) => {
    let c = 0;
    for (let i = Math.max(0, from); i < Math.min(messages.length, to); i++) {
      if (messages[i]?.role === 'assistant') c++;
    }
    return c;
  };

  // Request notes from API
  const requestNotes = async (mode: 'initial' | 'incremental') => {
    setNotesLoading(true);
    try {
      const startIdx = mode === 'initial' ? 0 : lastProcessedIndex + 1;
      const slice = mode === 'initial' ? messages : messages.slice(startIdx);
      const resp = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, messages: slice, existingNotes: notes }),
      });
      if (!resp.ok) throw new Error('Notes request failed');
      const data = await resp.json();
      const notesText: string = data?.notesText || '';
      if (notesText.trim()) {
        setNotes(prev => prev ? `${prev}\n\n${notesText.trim()}` : notesText.trim());
      }
      // Update last processed index to the end of messages array
      setLastProcessedIndex(messages.length - 1);
      setNotesInitialized(true);
    } catch (e) {
      console.error('[SidePanel] Notes generation error', e);
    } finally {
      setNotesLoading(false);
    }
  };

  // On switching to Notes tab, if not initialized and enough buyer messages, request initial notes
  React.useEffect(() => {
    if (activeTab !== 'notes') return;
    if (notesInitialized) return;
    const buyerCount = countAssistantMessages(0, messages.length);
    if (buyerCount > 2 && !notesLoading) {
      requestNotes('initial');
    }
  }, [activeTab, messages, notesInitialized, notesLoading]);

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          product,
          persona,
          scenarioSettings: { callType: window.localStorage.getItem('callType') ? JSON.parse(window.localStorage.getItem('callType')!) : null },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const data = await response.json();
      const suggestionText: string = data.suggestions || '';

      // Robust parsing: group into pairs (headline + quoted example)
      const lines = suggestionText
        .split(/\r?\n/)
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);

      const pairs: SuggestionPair[] = [];
      for (let i = 0; i < lines.length; i++) {
        const head = lines[i];
        // skip if the line is an orphan quote
        if (head.startsWith('"') && head.endsWith('"')) continue;
        let ex: string | undefined = undefined;
        const next = lines[i + 1];
        if (next && next.startsWith('"') && next.endsWith('"')) {
          ex = next.replace(/^"|"$/g, '');
          i += 1;
        }
        pairs.push({ head, ex });
      }

      setSuggestions(pairs);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      setSuggestions([{ head: 'Unable to get suggestions. Please try again.', ex: undefined }]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex space-x-1">
          <Button 
            variant={activeTab === 'coach' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('coach')}
            className="flex-1"
          >
            Coach
          </Button>
          <Button 
            variant={activeTab === 'notes' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('notes')}
            className="flex-1"
          >
            Notes
          </Button>
          <Button 
            variant={activeTab === 'improver' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveTab('improver')}
            className="flex-1"
          >
            Improver
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {activeTab === 'coach' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Get AI-powered suggestions to improve your pitch.
              </p>
              <Button 
                onClick={handleGetSuggestions}
                disabled={loadingSuggestions}
                className="w-full"
                size="sm"
              >
                {loadingSuggestions ? 'Getting Suggestions...' : 'Get Suggestions'}
              </Button>
            </div>
            
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Suggestions:</h4>
                <div className="space-y-3">
                  {suggestions.map((pair, index) => (
                    <div key={index} className="space-y-1">
                      <div className="text-xs p-2 rounded bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-200 dark:border-blue-800 font-medium">
                        <span className="flex-1 block">{pair.head}</span>
                      </div>
                      {pair.ex && (
                        <div className="text-xs p-2 rounded bg-green-50 dark:bg-green-900/20 border-l-2 border-green-200 dark:border-green-800 italic">
                          <div className="flex justify-between items-start gap-2">
                            <span className="flex-1">“{pair.ex}”</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => onPasteToInput(pair.ex!)}
                            >
                              Paste
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Key insights are automatically captured from the conversation.
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="w-full"
                disabled={notesLoading || (!notesInitialized && countAssistantMessages(0, messages.length) <= 2)}
                onClick={() => {
                  if (!notesInitialized) {
                    // Initial full chat request (guarded by >2 buyer messages)
                    if (countAssistantMessages(0, messages.length) > 2) requestNotes('initial');
                    return;
                  }
                  // Incremental update: require cooldown of >= 2 new buyer messages
                  const newBuyer = countAssistantMessages(lastProcessedIndex + 1, messages.length);
                  if (newBuyer >= 2) {
                    requestNotes('incremental');
                  }
                }}
              >
                {notesLoading
                  ? 'Generating notes…'
                  : (notesInitialized ? 'Update Notes' : 'Generate Notes')}
              </Button>
            </div>
            {/* Helper text about cooldown */}
            {notesInitialized && (
              <p className="text-xs text-muted-foreground">
                Updates are available after at least two new buyer messages since the last request.
              </p>
            )}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {notes.split('\n\n').filter(note => note.trim()).map((note, index) => {
                const lines = note.split('\n');
                const headerLine = lines[0];
                const contentLine = lines[1];
                
                // Parse the header to extract icon, category, and timestamp
                const headerMatch = headerLine.match(/^(.+?)\s\*\*(.+?)\*\*\s\((.+?)\)$/);
                if (headerMatch) {
                  const [, icon, category, timestamp] = headerMatch;
                  return (
                    <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{icon}</span>
                          <span className="font-semibold text-sm text-blue-800 dark:text-blue-200">{category}</span>
                        </div>
                        <span className="text-xs text-blue-600 dark:text-blue-400">{timestamp}</span>
                      </div>
                      <p className="text-sm italic text-gray-700 dark:text-gray-300 leading-relaxed">
                        {contentLine?.replace(/^"(.*)"$/, '$1') || ''}
                      </p>
                    </div>
                  );
                } else {
                  // Fallback for manual notes
                  return (
                    <div key={index} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{note}</p>
                    </div>
                  );
                }
              })}
            </div>
            <Textarea 
              placeholder="Add your own notes..." 
              value=""
              onChange={(e) => {
                const manualNote = e.target.value;
                if (manualNote.trim()) {
                  const timestamp = new Date().toLocaleTimeString();
                  const formattedNote = `📝 **Manual Note** (${timestamp})\n"${manualNote}"`;
                  setNotes(prev => prev ? `${prev}\n\n${formattedNote}` : formattedNote);
                  e.target.value = '';
                }
              }}
              className="min-h-[80px] text-sm"
              rows={3}
            />
          </div>
        )}

        {activeTab === 'improver' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button size="sm" variant={improverTab === 'current' ? 'default' : 'outline'} onClick={() => setImproverTab('current')}>Current</Button>
              <Button size="sm" variant={improverTab === 'history' ? 'default' : 'outline'} onClick={() => setImproverTab('history')}>History</Button>
            </div>
            {improverTab === 'current' && (
            <>
            <p className="text-sm text-muted-foreground">
              Paste or type a sentence in the chat input, then use the AI Improve button. Or run it here:
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="w-full"
                disabled={improverLoading}
                onClick={async () => {
                  if (!improverText || !improverText.trim()) return;
                  const wc = improverText.trim().split(/\s+/).filter(Boolean).length
                  if (wc < 5) return;
                  await runImprover(improverText);
                }}
              >
                {improverLoading ? 'Improving…' : 'Improve Current Input'}
              </Button>
            </div>
            {improverLoading && (
              <div className="text-xs text-muted-foreground">Analyzing sentence…</div>
            )}
            {improverData && !improverLoading && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Problems found</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {improverData.problems.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Suggestions</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {improverData.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Rewritten sentence</h4>
                  <div className="p-2 border rounded text-sm bg-muted/30 flex items-start justify-between gap-2">
                    <span className="flex-1">{improverData.rewritten}</span>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onPasteToInput(improverData.rewritten)}>
                      Paste
                    </Button>
                  </div>
                </div>
              </div>
            )}
            </>
            )}

            {improverTab === 'history' && (
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {improverHistory.length === 0 && (
                  <p className="text-xs text-muted-foreground">No previous improvements yet.</p>
                )}
                {improverHistory.map((it, idx) => (
                  <div key={idx} className="p-2 border rounded bg-muted/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{new Date(it.ts).toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onPasteToInput(it.rewritten)}>Paste</Button>
                      </div>
                    </div>
                    <div className="text-xs mb-1"><strong>Rewritten:</strong> {it.rewritten}</div>
                    {it.problems?.length > 0 && (
                      <div className="text-xs mb-1"><strong>Problems:</strong> {it.problems.join('; ')}</div>
                    )}
                    {it.suggestions?.length > 0 && (
                      <div className="text-xs"><strong>Suggestions:</strong> {it.suggestions.join('; ')}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SidePanel;
