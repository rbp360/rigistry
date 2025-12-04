
import Image from 'next/image';
import itemStyles from '../../item-pages/ItemPageCommon.module.css';
import Link from 'next/link';
import RoomGearList from '../RoomGearList';

export default function DJBoothRoom() {
  return (
    <main className={itemStyles.itemMain}>
      <div className={itemStyles.roomHeader}>
        <Link href="/rigistry" className={itemStyles.roomBackBtn}>← Back to Rigistry</Link>
        <Link href="/rigistry/dj-booth/add" className={itemStyles.addGearButton}>+ Add Gear</Link>
      </div>
      <h1 className={itemStyles.roomTitle}>DJ Booth</h1>
      <Image src="/branding/DJbooth.png" alt="DJ Booth" width={220} height={220} className={itemStyles.itemImage} />
      <p className={itemStyles.itemDesc}>Add decks, mixers, DJ controllers, media players, lighting trigger interfaces and performance accessories here.</p>
      {/* Removed lower Add Gear button */}
  <RoomGearList room="dj-booth" />
    </main>
  );
}
