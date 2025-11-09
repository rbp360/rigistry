'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number; // ms
};

interface ToastContextValue {
  addToast: (t: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
}

const ToastCtx = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const duration = t.duration ?? 3500;
    const next: ToastItem = { id, ...t, duration };
    setToasts((list) => [...list, next]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, [removeToast]);

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onClose={removeToast} />
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastViewport({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: string) => void }) {
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, display: 'grid', gap: 10, zIndex: 1000 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            minWidth: 260,
            maxWidth: 380,
            background: t.type === 'error' ? '#fee2e2' : t.type === 'success' ? '#ecfdf5' : '#f3f4f6',
            color: '#111827',
            border: '1px solid ' + (t.type === 'error' ? '#fecaca' : t.type === 'success' ? '#d1fae5' : '#e5e7eb'),
            borderRadius: 10,
            padding: '10px 12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          {t.title && <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.title}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontSize: 14 }}>{t.message}</div>
            <button onClick={() => onClose(t.id)} aria-label="Close" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}
