// Already updated in previous step
import Image from 'next/image';
import itemStyles from '../../item-pages/ItemPageCommon.module.css';
import Link from 'next/link';
import GuitarAmpGearList from './GearList';

export default function GuitarAmpRoom() {
  return (
    <main className={itemStyles.itemMain}>
      <div style={{ display: 'flex', alignItems: 'center', height: 40, marginBottom: 0, paddingTop: 0, borderTop: 'none', position: 'relative', zIndex: 2 }}>
        <Link href="/rigistry" style={{ background: '#222', color: '#fff', borderRadius: 8, padding: '7px 16px', fontSize: 15, textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', fontWeight: 600, marginRight: 'auto' }}>← Back to Rigistry</Link>
        {/* Removed lower Add Gear button */}
      </div>
      <h1 className={itemStyles.itemTitle} style={{ marginTop: 0, padding: '4px 0', border: 'none' }}>Guitar/Amp Room</h1>
      <Image src="/branding/Guitar room.png" alt="Guitar/Amp Room" width={220} height={220} loading="eager" priority className={itemStyles.itemImage} />
      <p className={itemStyles.itemDesc}>Add guitars, amps, pedals, and related gear here.</p>
      {/* Removed duplicate lower Add Gear button */}
      <GuitarAmpGearList />
    </main>
  );
}
