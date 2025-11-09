import Image from 'next/image';

export default function DrumRoom() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Drum Room</h1>
      <Image src="/branding/drum room.png" alt="Drum Room" width={220} height={220} />
      <p>Add drum kits, percussion, and related gear here.</p>
      {/* TODO: List gear in this room */}
    </main>
  );
}
