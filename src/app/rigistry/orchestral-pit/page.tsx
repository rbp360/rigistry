
import Image from 'next/image';
import itemStyles from '../../item-pages/ItemPageCommon.module.css';
import Link from 'next/link';
import RoomGearList from '../RoomGearList';

export default function OrchestralPitRoom() {
  return (
    <main className={itemStyles.itemMain}>
      <div className={itemStyles.roomHeader}>
        <Link href="/rigistry" className={itemStyles.roomBackBtn}>← Back to Rigistry</Link>
        <Link href="/rigistry/orchestral-pit/add" className={itemStyles.addGearButton}>+ Add Gear</Link>
      </div>
      <h1 className={itemStyles.roomTitle}>Orchestral pit</h1>
      <Image src="/branding/Orchestra.png" alt="Orchestral pit room illustration" width={260} height={260} className={itemStyles.itemImage} />
      <p className={itemStyles.itemDesc}>Add orchestral, ensemble, and pit instrumentation here.</p>
      {/* Removed lower Add Gear button */}
  <RoomGearList room="orchestral-pit" />
    </main>
  );
}
