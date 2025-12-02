'use client';

import { useAuth } from '@/contexts/AuthContext';
import { signInWithGoogle, signOutUser } from '@/lib/firebase';
import Image from 'next/image';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export default function AuthButtons() {
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  // Hooks must be unconditional
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (open && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, background: '#ddd', borderRadius: '50%' }} />
        <div style={{ width: 80, height: 10, background: '#e2e2e2', borderRadius: 4 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={async () => {
          try {
            await signInWithGoogle();
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Sign-in failed';
            addToast({ type: 'error', title: 'Sign-in failed', message: msg });
          }
        }}
        style={{
          background: '#111',
          color: '#fff',
          padding: '6px 14px',
          borderRadius: 6,
          fontSize: 14,
          cursor: 'pointer',
          border: '1px solid #222'
        }}
        aria-haspopup="true"
      >
        Sign in
      </button>
    );
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#1f2937',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: 24,
          fontSize: 14,
          cursor: 'pointer',
          border: '1px solid #374151',
          minWidth: 0
        }}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName ?? 'avatar'}
            width={28}
            height={28}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            aria-label="User avatar"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: 0.5
            }}
          >
            {(user.displayName || user.email || 'U')[0].toUpperCase()}
          </div>
        )}
        <span style={{ fontSize: 13, maxWidth: 120, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {user.displayName || user.email || 'User'}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            background: '#111',
            border: '1px solid #222',
            borderRadius: 12,
            minWidth: 200,
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            padding: 8,
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
          role="menu"
        >
          <Link href="/account" role="menuitem" style={menuItemStyle}>Account</Link>
          <Link href="/settings" role="menuitem" style={menuItemStyle}>Settings</Link>
          <Link href="/inbox" role="menuitem" style={menuItemStyle}>Inbox</Link>
          <button
            role="menuitem"
            onClick={() => {
              void signOutUser();
              setOpen(false);
            }}
            style={{ ...menuItemStyle, textAlign: 'left', background: 'transparent', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  color: '#fff',
  padding: '8px 12px',
  borderRadius: 8,
  fontSize: 14,
  textDecoration: 'none',
  background: 'transparent',
  display: 'block'
};
