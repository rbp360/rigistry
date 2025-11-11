// Add Gear page for DJ Booth room (reuses central /rigistry/add with preselected room)
import { redirect } from 'next/navigation';

export default function AddGearDJBooth() {
  // Redirect to shared add page; user can adjust kind, suggested room will stay or change.
  redirect('/rigistry/add?room=dj-booth');
}
