
import Image from 'next/image';
import Link from 'next/link';
import RoomGearList from '../RoomGearList';

export default function DJBoothRoom() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>DJ Booth</h1>
      <Image src="/branding/DJbooth.png" alt="DJ Booth" width={220} height={220} />
      <p>Add decks, mixers, DJ controllers, media players, lighting trigger interfaces and performance accessories here.</p>
      <div style={{ margin: '12px 0 20px' }}>
        <Link
          href="/rigistry/add?room=dj-booth&kind=decks-dj"
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
  <RoomGearList room="dj-booth" />
    </main>
  );
}
