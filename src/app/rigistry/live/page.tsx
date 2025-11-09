import Image from 'next/image';

export default function LiveRoom() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Live Room</h1>
      <Image src="/branding/Live room.png" alt="Live Room" width={220} height={220} />
      <p>Add PA, stage, and live gear here.</p>
      {/* TODO: List gear in this room */}
    </main>
  );
}
