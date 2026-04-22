import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import AppNavigation from './AppNavigation';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CaterTrack',
  description:
    'Catering operations dashboard for orders, clients, and menu management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_34%),linear-gradient(180deg,#fff8ef_0%,#fff1e0_48%,#ffe4c7_100%)]">
          <AppNavigation />
          {children}
        </div>
      </body>
    </html>
  );
}
