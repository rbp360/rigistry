"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DrumAddRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/rigistry/add?room=drum'); }, [router]);
  return <main style={{ padding: 24 }}><p>Redirecting to Add Gear…</p></main>;
}
