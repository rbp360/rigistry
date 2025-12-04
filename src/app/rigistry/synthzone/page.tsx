
import Image from 'next/image';
import Link from 'next/link';
import RoomGearList from '../RoomGearList';
// styles removed; using itemStyles for room layout
import itemStyles from '../../item-pages/ItemPageCommon.module.css';

export default function SynthzoneRoom() {
  return (
    <main className={itemStyles.itemMain}>
      <div className={itemStyles.roomHeader}>
        <Link href="/rigistry" className={itemStyles.roomBackBtn}>← Back to Rigistry</Link>
        <Link href="/rigistry/synthzone/add" className={itemStyles.addGearButton}>+ Add Gear</Link>
      </div>
      <h1 className={itemStyles.roomTitle}>Synthzone</h1>
      <Image src="/branding/Synthzone.png" alt="Synthzone" width={220} height={220} className={itemStyles.itemImage} />
      <p className={itemStyles.itemDesc}>Add synths, keys, and electronic gear here.</p>
      <RoomGearList room="synthzone" />
    </main>
  );
}
