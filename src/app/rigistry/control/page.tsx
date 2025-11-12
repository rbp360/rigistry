
import Image from 'next/image';
import Link from 'next/link';
import RoomGearList from '../RoomGearList';

export default function ControlRoom() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Control Room</h1>
      <Image src="/branding/Control room.png" alt="Control Room" width={220} height={220} />
      <p>Add mixing desks, monitors, and studio gear here.</p>
      <div style={{ margin: '12px 0 20px' }}>
        <Link
          href="/rigistry/add?room=control&kind=studio-sound"
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
  <RoomGearList room="control" />
    </main>
  );
}
