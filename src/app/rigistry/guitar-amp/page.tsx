// Already updated in previous step
import Image from 'next/image';
import itemStyles from '../../item-pages/ItemPageCommon.module.css';
import GuitarAmpGearList from './GearList';
import RoomHeaderActions from '../RoomHeaderActions';

export default function GuitarAmpRoom() {
  return (
    <main className={itemStyles.itemMain}>
      <RoomHeaderActions room="guitar-amp" kindHint="guitar" />
      <h1 className={itemStyles.itemTitle} style={{ marginTop: 0, padding: '4px 0', border: 'none' }}>Guitar/Amp Room</h1>
      <Image src="/branding/Guitar room.png" alt="Guitar/Amp Room" width={220} height={220} loading="eager" priority className={itemStyles.itemImage} />
      <p className={itemStyles.itemDesc}>Add guitars, amps, pedals, and related gear here.</p>
      {/* Removed duplicate lower Add Gear button */}
      <GuitarAmpGearList />
    </main>
  );
}
