"use client";
import { redirect } from 'next/navigation';

export default function RemovedVocalBooth() {
  // Redirect legacy /rigistry/vocal to Live room
  redirect('/rigistry/stage');
}
