
import Image from 'next/image';
import RoomGearList from '../RoomGearList';
import RoomHeaderActions from '../RoomHeaderActions';
import styles from '../Rigistry.module.css';

export default function ControlRoom() {
  return (
    <main className={styles.rigistryMain} style={{ textAlign: 'center' }}>
      <RoomHeaderActions room="control" kindHint="studio-sound" />
      <h1 style={{ color: '#22c55e', marginTop: '12px' }}>Control Room</h1>
      <Image src="/branding/Control room.png" alt="Control Room" width={220} height={220} />
      <p>Add mixing desks, monitors, and studio gear here.</p>
      {/* Removed inline Add Gear button; replaced by global header component */}
  <RoomGearList room="control" />
    </main>
  );
}
