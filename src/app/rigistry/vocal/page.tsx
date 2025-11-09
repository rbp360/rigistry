import Image from 'next/image';

export default function VocalBooth() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Vocal Booth</h1>
      <Image src="/branding/Vocal booth.png" alt="Vocal Booth" width={220} height={220} />
      <p>Add microphones, vocal processors, and related gear here.</p>
      {/* TODO: List gear in this room */}
    </main>
  );
}
