"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrchestralPitAddRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/rigistry/add?room=orchestral-pit'); }, [router]);
  return <main style={{ padding: 24 }}><p>Redirecting to Add Gear…</p></main>;
}
