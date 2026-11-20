import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

// Plex was drawn for technical documentation: calm, legible at small sizes, with clear tabular figures for live readouts.
const plex = IBM_Plex_Sans({ variable: '--font-plex', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Niskala: posture and screen-fatigue cues',
  description:
    'On-device posture and blink tracking with a quiet edge glow, a guided 60-second desk reset and bedtime-aware warm shift. Video never leaves the browser.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f1ec' },
    { media: '(prefers-color-scheme: dark)', color: '#131517' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${plex.variable} antialiased`}>
      <body className="min-h-dvh bg-paper font-sans text-ink">{children}</body>
    </html>
  );
}
