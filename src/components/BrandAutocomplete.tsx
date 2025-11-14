"use client";
import { useEffect, useRef, useState } from 'react';
import type { GearCategory } from '@/types/schema';

interface BrandAutocompleteProps {
  value: string;
  category?: GearCategory | string; // current gear kind
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface ApiResult { total: number; items: string[]; }

const DEBOUNCE_MS = 160;

export default function BrandAutocomplete({ value, category, onChange, placeholder, disabled }: BrandAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keep internal query synced when external value changes (e.g., clearing form)
  useEffect(() => { setQuery(value); }, [value]);

  // Fetch suggestions when query changes (including empty -> initial list)
  useEffect(() => {
    const handle = setTimeout(async () => {
      try {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        setLoading(true);
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (category) params.set('category', String(category).toLowerCase());
        params.set('limit', '30');
        const url = `/api/manufacturers?${params.toString()}`;
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error('Failed');
        const data: ApiResult = await res.json();
        setResults(data.items);
        // Open list if we have results OR we're showing initial suggestions
        setOpen(data.items.length > 0);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setResults([]);
          setOpen(false);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, category]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        disabled={disabled}
        value={query}
        onChange={(e) => { const v = e.target.value; setQuery(v); onChange(v); }}
  onFocus={() => { if (results.length) setOpen(true); else setQuery(prev => prev); }}
        placeholder={placeholder || 'Start typing a brand…'}
        style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, width: '100%' }}
        aria-autocomplete="list"
        aria-controls="brand-autocomplete-list"
        aria-expanded={open}
        role="combobox"
      />
      {open && results.length > 0 && (
        <ul
          id="brand-autocomplete-list"
            style={{
              position: 'absolute',
              top: '100%', left: 0, right: 0,
              zIndex: 20,
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: 8,
              margin: 0,
              padding: 4,
              listStyle: 'none',
              maxHeight: 240,
              overflowY: 'auto',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
            }}
        >
          {results.map((r) => (
            <li key={r}>
              <button
                type="button"
                onClick={() => { onChange(r); setQuery(r); setOpen(false); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  fontSize: 14,
                  borderRadius: 6
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                {r}
              </button>
            </li>
          ))}
          {loading && (
            <li style={{ padding: '6px 8px', fontSize: 12, opacity: 0.7 }}>Loading…</li>
          )}
        </ul>
      )}
      {!loading && query && results.length === 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ccc', borderRadius: 8, padding: '6px 8px', fontSize: 12, zIndex: 20 }}>No matches</div>
      )}
    </div>
  );
}
