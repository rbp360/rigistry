"use client";
import Image from 'next/image';
import Link from 'next/link';
import styles from './Rigistry.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { listGearByOwner } from '@/lib/db';

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
    name: 'Synthzone',
    key: 'synthzone',
    img: '/branding/Synthzone.png',
  },
  {
    name: 'Stage',
    key: 'stage',
    img: '/branding/Live room.png',
  },
  {
    name: 'DJ booth',
    key: 'dj-booth',
    img: '/branding/DJbooth.png',
  },
  {
    name: 'Orchestral pit',
    key: 'orchestral-pit',
    img: '/branding/Orchestra.png',
  },
] as const;

type RoomKey = typeof rooms[number]["key"];

export default function RigistryPage() {
  const { user } = useAuth();
  const [gearCounts, setGearCounts] = useState<Record<RoomKey, number>>({
    'guitar-amp': 0,
    control: 0,
    drum: 0,
    synthzone: 0,
    stage: 0,
    'dj-booth': 0,
    'orchestral-pit': 0,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const all = await listGearByOwner(user.uid);
      const counts: Record<RoomKey, number> = {
        'guitar-amp': 0,
        control: 0,
        drum: 0,
        synthzone: 0,
        stage: 0,
        'dj-booth': 0,
        'orchestral-pit': 0,
      };
      const normalize = (r?: string): RoomKey | null => {
        if (!r) return null;
        if (r === 'live') return 'stage';
        const valid = ['guitar-amp','control','drum','synthzone','stage','dj-booth','orchestral-pit'] as const;
        return (valid as readonly string[]).includes(r) ? (r as RoomKey) : null;
      };
      for (const g of all) {
        const rk = normalize(g.room);
        if (rk) counts[rk]++;
      }
      setGearCounts(counts);
    })();
  }, [user]);

  return (
    <main className={styles.rigistryMain}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Rigistry: Get Started</h1>
        <Link href="/rigistry/add" style={{ fontSize: 28, background: '#222', color: '#fff', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} title="Add Gear">
          +
        </Link>
      </div>
      <div className={styles.roomsGrid} style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {rooms.map(room => (
          <Link key={room.key} href={`/rigistry/${room.key}`} className={styles.roomCard}>
            <div className={styles.cardInner}>
              <div
                className={`${styles.roomThumb} ${gearCounts[room.key as RoomKey] > 0 ? styles.activeThumb : styles.grayed}`}
              >
                <Image src={room.img} alt={room.name} width={160} height={160} />
              </div>
              <h2>{room.name}</h2>
              <p>{gearCounts[room.key as RoomKey] > 0 ? `${gearCounts[room.key as RoomKey]} item(s)` : 'Empty'}</p>
            </div>
          </Link>
        ))}
        <div className={styles.roomCard}>
          <div className={`${styles.cardInner} ${styles.quickActionCardInner}`}>
            <div className={`${styles.roomThumb} ${styles.quickActionThumb}`}>
              <Link
                href="/rigistry/add"
                className={styles.quickActionBtn}
                title="Add Gear"
              >
                + Add Gear
              </Link>
              <Link
                href="/rigistry/carnet"
                className={styles.quickActionBtn}
              >
                Create a Carnet
              </Link>
            </div>
            <h2>Quick Actions</h2>
          </div>
        </div>
      </div>
    </main>
  );
}
