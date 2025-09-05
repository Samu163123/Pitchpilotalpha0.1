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
}

const SidePanel = ({ messages, product, persona, onPasteToInput }: SidePanelProps) => {
  const [activeTab, setActiveTab] = useState('coach');
  const [notes, setNotes] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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
    
    const matches = [];
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
      
      // Parse the formatted suggestions
      const suggestionText = data.suggestions;
      const parsedSuggestions = suggestionText
        .split('\\n')
        .filter((line: string) => line.trim() !== '')
        .map((line: string) => line.trim());
      
      setSuggestions(parsedSuggestions);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      setSuggestions(['Unable to get suggestions. Please try again.']);
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
                  {suggestions.map((suggestion, index) => {
                    const isQuote = suggestion.startsWith('"') && suggestion.endsWith('"');
                    return (
                      <div key={index} className={`text-xs p-2 rounded ${
                        isQuote 
                          ? 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-200 dark:border-green-800 italic' 
                          : 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-200 dark:border-blue-800 font-medium'
                      }`}>
                        <div className="flex justify-between items-start gap-2">
                          <span className="flex-1">{suggestion}</span>
                          {isQuote && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => onPasteToInput(suggestion.slice(1, -1))}
                            >
                              Paste
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
      </CardContent>
    </Card>
  );
};

export default SidePanel;
