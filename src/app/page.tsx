// Home should show the About/Hero page on Vercel
import { redirect } from 'next/navigation';

export default function Home() {
  // Keep a single source of truth: redirect to /about
  redirect('/about');
}
// Redirect-only home implementation; content lives at /about
