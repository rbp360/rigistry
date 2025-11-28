
import Image from 'next/image';
import itemStyles from '../../item-pages/ItemPageCommon.module.css';
import Link from 'next/link';
import RoomGearList from '../RoomGearList';

export default function DJBoothRoom() {
  return (
    <main className={itemStyles.itemMain}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 48, marginBottom: 16 }}>
        <div>
          <Link href="/rigistry" style={{ background: '#222', color: '#fff', borderRadius: 8, padding: '7px 16px', fontSize: 15, textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', fontWeight: 600 }}>← Back to Rigistry</Link>
        </div>
        <div>
          <Link href="/rigistry/dj-booth/add" style={{ background: '#2e7d32', color: '#fff', borderRadius: 8, padding: '7px 16px', fontSize: 15, textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', fontWeight: 600 }}>+ Add Item</Link>
        </div>
      </div>
      <h1 className={itemStyles.itemTitle} style={{ marginTop: 0 }}>DJ Booth</h1>
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
