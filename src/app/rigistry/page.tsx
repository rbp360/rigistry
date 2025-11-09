import Image from 'next/image';
import Link from 'next/link';
import styles from './Rigistry.module.css';


const rooms = [
  {
    name: 'Guitar/Amp room',
    key: 'guitar-amp',
    img: '/branding/Guitar room.png',
  },
  {
    name: 'Control room',
    key: 'control',
    img: '/branding/Control room.png',
  },
  {
    name: 'Drum room',
    key: 'drum',
    img: '/branding/drum room.png',
  },
  {
    name: 'Vocal booth',
    key: 'vocal',
    img: '/branding/Vocal booth.png',
  },
  {
    name: 'Synthzone',
    key: 'synthzone',
    img: '/branding/Synthzone.png',
  },
  {
    name: 'Live',
    key: 'live',
    img: '/branding/Live room.png',
  },
] as const;

type RoomKey = typeof rooms[number]["key"];

export default function RigistryPage() {
  // TODO: Replace with real gear count logic
  const gearCounts: Record<RoomKey, number> = {
    'guitar-amp': 0,
    control: 0,
    drum: 0,
    vocal: 0,
    synthzone: 0,
    live: 0,
  };

  return (
    <main className={styles.rigistryMain}>
      <h1>Rigistry: Get Started</h1>
      <div className={styles.roomsGrid}>
        {rooms.map(room => (
          <Link key={room.key} href={`/rigistry/${room.key}`} className={styles.roomCard}>
            <div className={gearCounts[room.key as RoomKey] === 0 ? styles.grayed : ''}>
              <Image src={room.img} alt={room.name} width={160} height={160} />
              <h2>{room.name}</h2>
              <p>{gearCounts[room.key as RoomKey] > 0 ? `${gearCounts[room.key as RoomKey]} item(s)` : 'Empty'}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
