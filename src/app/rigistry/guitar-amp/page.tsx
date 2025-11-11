import Image from 'next/image';
import Link from 'next/link';
import GuitarAmpGearList from './GearList';

export default function GuitarAmpRoom() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Guitar/Amp Room</h1>
      <Image src="/branding/Guitar room.png" alt="Guitar/Amp Room" width={220} height={220} />
      <p>Add guitars, amps, pedals, and related gear here.</p>
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
      <GuitarAmpGearList />
    </main>
  );
}
