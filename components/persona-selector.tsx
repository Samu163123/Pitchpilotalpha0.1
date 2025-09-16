"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Sparkles, Save, Database } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type PersonaItem = { id: string; name: string; description: string; icon: string; background: string; pains: string[]; mindset: string }
type SavedPersonaRow = { id: string; name: string; description: string | null; icon: string | null; background: string | null; pains: string[] | null; mindset: string | null }

interface PersonaSelectorProps {
  selectedPersona: PersonaItem | null
  onSelect: (persona: PersonaItem) => void
  personas: PersonaItem[]
  onApply?: (persona: PersonaItem) => void
}

export function PersonaSelector({ selectedPersona, onSelect, personas, onApply }: PersonaSelectorProps) {
  const [showSaved, setShowSaved] = useState(false); // default to Catalog per request
  const [saved, setSaved] = useState<PersonaItem[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const supabase = getSupabaseBrowserClient();

  const loadSaved = async () => {
    setLoadingSaved(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        // Not authenticated -> load from localStorage fallback
        try {
          const raw = localStorage.getItem('savedPersonas');
          const parsed = raw ? JSON.parse(raw) : [];
          if (Array.isArray(parsed)) setSaved(parsed);
          else setSaved([]);
        } catch { setSaved([]); }
        return;
      }
      const { data, error } = await supabase
        .from('saved_personas')
        .select('id,name,description,icon,background,pains,mindset')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mapped: PersonaItem[] = (data as SavedPersonaRow[]).map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? '',
        icon: r.icon ?? '🧑',
        background: r.background ?? '',
        pains: r.pains ?? [],
        mindset: r.mindset ?? '',
      }));
      // Merge with localStorage fallback so locally saved AI personas are visible too
      let local: PersonaItem[] = []
      try {
        const raw = localStorage.getItem('savedPersonas');
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) local = parsed;
      } catch {}
      const dedupeKey = (p: PersonaItem) => `${(p.name||'').trim().toLowerCase()}|${(p.background||'').trim().toLowerCase()}`;
      const mergedMap = new Map<string, PersonaItem>();
      for (const it of [...mapped, ...local]) {
        const k = dedupeKey(it);
        if (!mergedMap.has(k)) mergedMap.set(k, it);
      }
      setSaved(Array.from(mergedMap.values()));
    } catch (e) {
      console.warn('[PersonaSelector] Failed to load saved personas from Supabase, using local fallback');
      try {
        const raw = localStorage.getItem('savedPersonas');
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) setSaved(parsed);
        else setSaved([]);
      } catch { setSaved([]); }
    } finally {
      setLoadingSaved(false);
    }
  };

  const deletePersona = async (id: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        // localStorage removal
        try {
          const raw = localStorage.getItem('savedPersonas');
          const parsed = raw ? JSON.parse(raw) : [];
          const next = Array.isArray(parsed) ? parsed.filter((x: PersonaItem) => x.id !== id) : [];
          localStorage.setItem('savedPersonas', JSON.stringify(next));
          setSaved(next);
        } catch {}
        return;
      }
      const { error } = await supabase.from('saved_personas').delete().eq('user_id', user.id).eq('id', id);
      if (error) throw error;
      await loadSaved();
    } catch (e) {
      // Fallback to local delete
      try {
        const raw = localStorage.getItem('savedPersonas');
        const parsed = raw ? JSON.parse(raw) : [];
        const next = Array.isArray(parsed) ? parsed.filter((x: PersonaItem) => x.id !== id) : [];
        localStorage.setItem('savedPersonas', JSON.stringify(next));
        setSaved(next);
      } catch {}
    }
  };

  useEffect(() => {
    if (showSaved) loadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSaved]);

  // Load saved once on mount as well, so we can detect duplicates while in Catalog
  useEffect(() => {
    if (!saved.length) {
      loadSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDuplicate = (p: PersonaItem) => {
    const key = `${(p.name || '').trim().toLowerCase()}|${(p.background || '').trim().toLowerCase()}`;
    return saved.some(sp => `${(sp.name || '').trim().toLowerCase()}|${(sp.background || '').trim().toLowerCase()}` === key);
  };

  const savePersona = async (p: PersonaItem) => {
    try {
      // Client-side dedupe
      if (isDuplicate(p)) {
        setShowSaved(true);
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        // Save to localStorage fallback
        const item = { ...p, id: p.id || String(Date.now()) };
        try {
          const raw = localStorage.getItem('savedPersonas');
          const parsed = raw ? JSON.parse(raw) : [];
          const next = Array.isArray(parsed) ? [item, ...parsed] : [item];
          localStorage.setItem('savedPersonas', JSON.stringify(next));
          setShowSaved(true);
          setSaved(next);
        } catch {}
        return;
      }
      const { error } = await supabase.from('saved_personas').insert({
        user_id: user.id,
        name: p.name,
        description: p.description,
        icon: p.icon,
        background: p.background,
        pains: p.pains,
        mindset: p.mindset,
      });
      if (error) throw error;
      // Show the Saved tab and refresh
      setShowSaved(true);
      await loadSaved();
    } catch (e) {
      console.warn('[PersonaSelector] Save failed, writing to local fallback');
      // Fallback to localStorage in case of Supabase error
      const item = { ...p, id: p.id || String(Date.now()) };
      try {
        const raw = localStorage.getItem('savedPersonas');
        const parsed = raw ? JSON.parse(raw) : [];
        const next = Array.isArray(parsed) ? [item, ...parsed] : [item];
        localStorage.setItem('savedPersonas', JSON.stringify(next));
        setShowSaved(true);
        setSaved(next);
      } catch {}
    }
  };

  const list = showSaved ? saved : personas;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h2 className="text-xl font-semibold mb-1">Who are you selling to?</h2>
          <p className="text-muted-foreground">Choose a saved persona or browse suggestions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showSaved ? 'default' : 'outline'} size="sm" onClick={() => setShowSaved(true)}>
            <Database className="w-4 h-4 mr-1" /> Saved Personas
          </Button>
          <Button variant={!showSaved ? 'default' : 'outline'} size="sm" onClick={() => setShowSaved(false)}>
            Catalog
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {loadingSaved && showSaved && (
          <Card className="p-4"><CardContent>Loading saved personas…</CardContent></Card>
        )}
        {(showSaved ? list : list.slice(0, 4)).map((persona, idx) => (
          <Card
            key={`${persona.id}-${idx}`}
            className={`selection-card cursor-pointer transition-all duration-300 shadow-modern border-white ${
              selectedPersona?.id === persona.id ? "selected ring-2 ring-emerald-500 scale-[1.01]" : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:scale-[1.02]"
            }`}
            onClick={() => onSelect(persona)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{persona.icon}</div>
                <div>
                  <CardTitle className="text-lg">{persona.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {persona.name.toLowerCase()}
                  </Badge>
                </div>
                {selectedPersona?.id === persona.id && (
                  <span className="ml-auto inline-flex w-5 h-5 rounded-full bg-emerald-500 items-center justify-center animate-scale-in">
                    <span className="w-2 h-2 bg-white rounded-full" />
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">{persona.description}</p>
              <div className="text-sm space-y-2">
                <div>
                  <p className="font-medium mb-1">Background:</p>
                  <p className="text-muted-foreground text-xs">{persona.background}</p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  {!showSaved && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isDuplicate(persona)}
                      title={isDuplicate(persona) ? 'Already saved' : 'Save to Saved Personas'}
                      onClick={(e) => { e.stopPropagation(); savePersona(persona) }}
                    >
                      <Save className="w-4 h-4 mr-1" /> {isDuplicate(persona) ? 'Saved' : 'Save'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(persona);
                      if (onApply) onApply(persona);
                    }}
                  >
                    Apply Persona
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {/* Catalog: extra row for Create AI Persona card, full width under the 2x2 grid */}
        {!showSaved && (
          <div className="md:col-span-2">
            <Link href="/train/persona" className="block">
              <Card className="cursor-pointer transition-all duration-300 bg-gradient-to-br from-primary/5 to-secondary/10 hover:shadow-lg hover:scale-[1.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">Create personalized persona</CardTitle>
                      <Badge variant="secondary" className="text-xs">AI-assisted or manual</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">Craft a buyer persona tailored to your product. Fill in what you know and let AI complete the rest.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}
        {showSaved && list.length > 0 && (
          <div className="md:col-span-2 space-y-2">
            {list.map((sp, idx) => (
              <div key={`saved-${sp.id}-${idx}`} className="flex items-center justify-between border rounded-md px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{sp.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{sp.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{sp.background}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => onSelect(sp)}>Use</Button>
                  <Button size="sm" variant="destructive" onClick={() => deletePersona(sp.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
