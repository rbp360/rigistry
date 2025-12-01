import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from '@/contexts/ToastContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Catalogue - All Your Gear, one database",
  description: "Catalogue: unified gear registry and management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <ToastProvider>
          <header className="site-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid #e5e7eb', background: '#181818', color: '#f5f5f5' }}>
            <nav style={{ display: 'flex', gap: 32, fontSize: 20, fontWeight: 600 }}>
              <Link href="/rigistry">Catalogue</Link>
              <Link href="/connect">Connect</Link>
              <Link href="/about">About</Link>
              {/* CTA moved to Rigistry page */}
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Link href="/inbox" style={{
                padding: '6px 12px',
                borderRadius: 6,
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#e5e7eb',
                fontWeight: 600
              }}>Inbox</Link>
              <AuthButtons />
            </div>
          </header>
          {children}
          <footer className="site-footer">
            <nav style={{ display: 'flex', gap: 32, fontSize: 16 }}>
              <Link href="/rigistry">Catalogue</Link>
              <Link href="/connect">Connect</Link>
              <Link href="/about">About</Link>
            </nav>
            <small>© {new Date().getFullYear()} Catalogue. All rights reserved.</small>
          </footer>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
