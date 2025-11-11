import { redirect } from 'next/navigation';

// Legacy route kept for backward-compatible bookmarks. Immediately redirect to the renamed room.
export default function LegacyLiveRoomRedirect() {
  redirect('/rigistry/stage');
}
