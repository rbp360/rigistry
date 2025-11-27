
import Image from 'next/image';
import Link from 'next/link';
import RoomGearList from '../RoomGearList';

export default function StageRoom() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', background: "url('/branding/logo1.png') center/contain no-repeat fixed, #000" }}>
      <h1 style={{ color: '#22c55e' }}>Stage</h1>
      <Image src="/branding/Live room.png" alt="Stage" width={220} height={220} />
      <p>Add PA, stage and performance gear here.</p>
      <div style={{ margin: '12px 0 20px' }}>
        <Link
          href="/rigistry/add?room=stage&kind=live-sound"
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
  <RoomGearList room="stage" />
    </main>
  );
}
