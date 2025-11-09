import Image from 'next/image';

export default function SynthzoneRoom() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Synthzone</h1>
      <Image src="/branding/Synthzone.png" alt="Synthzone" width={220} height={220} />
      <p>Add synths, keys, and electronic gear here.</p>
      {/* TODO: List gear in this room */}
    </main>
  );
}
