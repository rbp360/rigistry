import Image from 'next/image';

export default function ControlRoom() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Control Room</h1>
      <Image src="/branding/Control room.png" alt="Control Room" width={220} height={220} />
      <p>Add mixing desks, monitors, and studio gear here.</p>
      {/* TODO: List gear in this room */}
    </main>
  );
}
