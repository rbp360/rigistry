
import Image from 'next/image';
import Link from 'next/link';
import RoomGearList from '../RoomGearList';

export default function OrchestralPitRoom() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', background: "url('/branding/logo1.png') center/contain no-repeat fixed, #000" }}>
      <h1 style={{ color: '#22c55e' }}>Orchestral pit</h1>
      <Image src="/branding/Orchestra.png" alt="Orchestral pit room illustration" width={260} height={260} />
      <p>Add orchestral, ensemble, and pit instrumentation here.</p>
      <div style={{ margin: '12px 0 20px' }}>
        <Link
          href="/rigistry/add?room=orchestral-pit&kind=strings"
          style={{
            display: 'inline-block',
            background: '#444',
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
  <RoomGearList room="orchestral-pit" />
    </main>
  );
}
