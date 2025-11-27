"use client";
import { redirect } from 'next/navigation';

export default function RemovedVocalAdd() {
	// Redirect legacy /rigistry/vocal/add to Add Gear with Live suggestion
	redirect('/rigistry/add?room=stage&kind=vocals-microphone');
}