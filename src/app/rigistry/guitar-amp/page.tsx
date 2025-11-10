import Image from 'next/image';
import GuitarAmpGearList from './GearList';

export default function GuitarAmpRoom() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Guitar/Amp Room</h1>
      <Image src="/branding/Guitar room.png" alt="Guitar/Amp Room" width={220} height={220} />
      <p>Add guitars, amps, pedals, and related gear here.</p>
      <GuitarAmpGearList />
    </main>
  );
}
