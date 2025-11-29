
import Image from 'next/image';
import RoomGearList from '../RoomGearList';
import RoomHeaderActions from '../RoomHeaderActions';

export default function ControlRoom() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center', minHeight: '100vh', background: "url('/branding/logo1.png') center/contain no-repeat fixed, #000", position: 'relative' }}>
      <RoomHeaderActions room="control" kindHint="studio-sound" />
      <h1 style={{ color: '#22c55e', marginTop: '12px' }}>Control Room</h1>
      <Image src="/branding/Control room.png" alt="Control Room" width={220} height={220} />
      <p>Add mixing desks, monitors, and studio gear here.</p>
      {/* Removed inline Add Gear button; replaced by global header component */}
  <RoomGearList room="control" />
    </main>
  );
}
