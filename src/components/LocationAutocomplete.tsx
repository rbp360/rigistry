"use client";
import { useEffect, useMemo, useRef, useState } from 'react';

export interface Prediction {
  description: string;
  place_id: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  limit = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (p: Prediction) => void;
  placeholder?: string;
  limit?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [items, setItems] = useState<Prediction[]>([]);
  // Track loading if we later want a spinner/busy state
  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<number>(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Session token improves billing accuracy for Google Places
  const session = useMemo(() => crypto.randomUUID(), []);

  // Sync external value -> internal query
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setItems([]);
      setOpen(false);
      setError(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await fetch(`/api/places-autocomplete?q=${encodeURIComponent(q)}&limit=${limit}&session=${encodeURIComponent(session)}`, { signal: ctrl.signal });
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(txt || `HTTP ${resp.status}`);
        }
        const data = await resp.json() as { predictions?: Prediction[], error?: string };
        const preds = data.predictions || [];
        setItems(preds);
        setOpen(preds.length > 0);
        if (preds.length === 0 && data.error) {
          setError(data.error);
        }
        setHighlight(-1);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        console.error('location autocomplete failed', e);
        setError('Failed to load suggestions');
        setItems([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query, limit, session]);

  function choose(p: Prediction) {
    onChange(p.description);
    setQuery(p.description);
    setOpen(false);
    onSelect?.(p);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const p = items[highlight] || items[0];
      if (p) choose(p);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <input
        placeholder={placeholder || 'Location (city, region)'}
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); }}
        onFocus={() => { if (items.length) setOpen(true); }}
        onKeyDown={onKeyDown}
        style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #444', background: '#222', color: '#ddd', width: '100%' }}
      />
      {open && items.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, zIndex: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          {items.map((p, idx) => (
            <button
              key={p.place_id}
              type="button"
              onMouseEnter={() => setHighlight(idx)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(p)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                background: idx === highlight ? '#2a2a2a' : 'transparent',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                borderBottom: idx === items.length - 1 ? 'none' : '1px solid #2b2b2b',
              }}
            >
              {p.description}
            </button>
          ))}
        </div>
      )}
      {error && (
        <div style={{ marginTop: 6, fontSize: 12, color: '#f87171' }}>{error}</div>
      )}
    </div>
  );
}
