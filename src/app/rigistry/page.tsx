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
  const { user } = useAuth();
  const [gearCounts, setGearCounts] = useState<Record<RoomKey, number>>({
    'guitar-amp': 0,
    control: 0,
    drum: 0,
    vocal: 0,
    synthzone: 0,
    live: 0,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const all = await listGearByOwner(user.uid);
      const counts: Record<RoomKey, number> = {
        'guitar-amp': 0,
        control: 0,
        drum: 0,
        vocal: 0,
        synthzone: 0,
        live: 0,
      };
      for (const g of all) {
        if (g.room && counts[g.room as RoomKey] !== undefined) {
          counts[g.room as RoomKey]++;
        }
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
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Link href="/rigistry/add" style={{ fontSize: 22, background: '#222', color: '#fff', borderRadius: 24, padding: '12px 28px', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }} title="Add Gear">
          + Add Gear
        </Link>
      </div>
    </main>
  );
}
