import Image from 'next/image';
import Link from 'next/link';

export default function OrchestralPitRoom() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Orchestral pit</h1>
      <Image src="/branding/Orchestra.png" alt="Orchestral pit room illustration" width={260} height={260} />
      <p>Add orchestral, ensemble, and pit instrumentation here.</p>
      <div style={{ margin: '12px 0 20px' }}>
        <Link
          href="/rigistry/add"
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
      {/* TODO: List gear filtered by room = 'orchestral-pit' */}
    </main>
  );
}
