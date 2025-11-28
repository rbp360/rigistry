
import Image from 'next/image';
import itemStyles from '../../item-pages/ItemPageCommon.module.css';
import Link from 'next/link';
import RoomGearList from '../RoomGearList';

export default function StageRoom() {
  return (
    <main className={itemStyles.itemMain}>
      <div className={itemStyles.roomHeader}>
        <Link href="/rigistry" className={itemStyles.roomBackBtn}>← Back to Rigistry</Link>
        <Link href="/rigistry/stage/add" className={itemStyles.addGearButton}>+ Add Gear</Link>
      </div>
      <h1 className={itemStyles.roomTitle}>Stage</h1>
      <Image src="/branding/Live room.png" alt="Stage" width={220} height={220} className={itemStyles.itemImage} />
      <p className={itemStyles.itemDesc}>Add PA, stage and performance gear here.</p>
      {/* Removed lower Add Gear button */}
  <RoomGearList room="stage" />
    </main>
  );
}
