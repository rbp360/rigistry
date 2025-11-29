import Link from 'next/link';
import itemStyles from '../item-pages/ItemPageCommon.module.css';

interface RoomHeaderActionsProps {
  room?: string; // slug like 'drum', 'control', 'guitar-amp'
  kindHint?: string; // optional kind to prefill add gear
}

export default function RoomHeaderActions({ room, kindHint }: RoomHeaderActionsProps) {
  // Build add gear href. If a dedicated room add route exists we keep pattern /rigistry/<room>/add
  // otherwise fall back to /gear/add with room and kind query params for proper back link.
  const hasRoomAddRoute = true; // current drum page uses /rigistry/<room>/add; keep consistent
  const addHref = room && hasRoomAddRoute
    ? `/rigistry/${room}/add`
    : `/gear/add${room ? `?room=${encodeURIComponent(room)}` : ''}${room && kindHint ? `&kind=${encodeURIComponent(kindHint)}` : ''}`;

  return (
    <div className={itemStyles.roomHeader}>
      <Link href="/rigistry" className={itemStyles.roomBackBtn}>← Back to Rigistry</Link>
      <Link href={addHref} className={itemStyles.addGearButton}>+ Add Gear</Link>
    </div>
  );
}
