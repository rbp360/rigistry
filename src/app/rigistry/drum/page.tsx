
import Image from 'next/image';
import itemStyles from '../../item-pages/ItemPageCommon.module.css';
import Link from 'next/link';
import RoomGearList from '../RoomGearList';

export default function DrumRoom() {
  return (
    <main className={itemStyles.itemMain}>
      <div className={itemStyles.roomHeader}>
        <Link href="/rigistry" className={itemStyles.roomBackBtn}>← Back to Rigistry</Link>
        <Link href="/rigistry/drum/add" className={itemStyles.addGearButton}>+ Add Gear</Link>
      </div>
      <h1 className={itemStyles.roomTitle}>Drum Room</h1>
      <Image src="/branding/drum room.png" alt="Drum Room" width={220} height={220} className={itemStyles.itemImage} />
      <p className={itemStyles.itemDesc}>Add drum kits, percussion, and related gear here.</p>
      {/* Removed lower Add Gear button */}
  <RoomGearList room="drum" />
    </main>
  );
}
