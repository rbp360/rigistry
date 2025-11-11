"use client";
import { useEffect, useState, useRef } from 'react';
import { suggestInstruments } from '@/lib/instruments';
import type { GearCategory, RoomKey } from '@/types/schema';

interface Props {
  value: string;
  onChange: (v: string) => void;
  kind?: GearCategory;
  room?: RoomKey | string;
  placeholder?: string;
}

export default function KindDetailAutocomplete({ value, onChange, kind, room, placeholder }: Props) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => setQuery(value || ''), [value]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const list = await suggestInstruments({ query, kind, room: (room as RoomKey) || undefined });
        setSuggestions(list);
        setOpen(true);
        setHighlight(0);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [query, kind, room]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function acceptSuggestion(s: string) {
    onChange(s);
    setQuery(s);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(h => (h + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      acceptSuggestion(suggestions[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
        onFocus={() => { if (suggestions.length) setOpen(true); }}
        onKeyDown={onKeyDown}
        placeholder={placeholder || 'e.g. electric guitar'}
        style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, width: '100%' }}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul style={{
          listStyle: 'none', margin: 0, padding: 0,
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid #ddd', borderRadius: 8,
          maxHeight: 240, overflowY: 'auto', zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          {suggestions.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => acceptSuggestion(s)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 10px', background: i === highlight ? '#111' : 'transparent',
                  color: i === highlight ? '#fff' : '#222', border: 'none', cursor: 'pointer'
                }}
                onMouseEnter={() => setHighlight(i)}
              >{s}</button>
            </li>
          ))}
          {loading && <li style={{ padding: '8px 10px', fontSize: 12, opacity: 0.7 }}>Loading…</li>}
        </ul>
      )}
      {!loading && query && suggestions.length === 0 && open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '8px 10px', fontSize: 12 }}>No matches</div>
      )}
    </div>
  );
}
