import Image from 'next/image';
import Link from 'next/link';

export default function VocalBooth() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Vocal Booth</h1>
      <Image src="/branding/Vocal booth.png" alt="Vocal Booth" width={220} height={220} />
      <p>Add microphones, vocal processors, and related gear here.</p>
      <div style={{ margin: '12px 0 20px' }}>
        <Link
          href="/rigistry/add?room=vocal&kind=vocals-microphone"
          style={{
            display: 'inline-block',
            background: '#222',
            color: '#fff',
            borderRadius: 24,
            padding: '10px 18px',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)'
          }}
        >
          + Add Gear
        </Link>
      </div>
      {/* TODO: List gear in this room */}
    </main>
  );
}
