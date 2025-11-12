
import Image from 'next/image';
import Link from 'next/link';
import RoomGearList from '../RoomGearList';

export default function SynthzoneRoom() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Synthzone</h1>
      <Image src="/branding/Synthzone.png" alt="Synthzone" width={220} height={220} />
      <p>Add synths, keys, and electronic gear here.</p>
      <div style={{ margin: '12px 0 20px' }}>
        <Link
          href="/rigistry/add?room=synthzone&kind=keyboard-synth-sampler"
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
  <RoomGearList room="synthzone" />
    </main>
  );
}
