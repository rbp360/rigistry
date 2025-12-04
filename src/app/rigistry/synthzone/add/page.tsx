"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SynthzoneAddRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/rigistry/add?room=synthzone'); }, [router]);
  return <main style={{ padding: 24 }}><p>Redirecting to Add Gear…</p></main>;
}
