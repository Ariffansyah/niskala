import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { THEME_SCRIPT } from '@/lib/store';
import { SITE_URL } from '@/lib/site';
import './globals.css';

// Drawn by Tokotype for Jakarta's own city identity: warm, open shapes and clear figures for live readouts.
const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'] });

const description =
  'On-device posture and blink tracking with a soft edge glow instead of pop-ups, guided 60-second desk resets, eye breaks and a bedtime-aware warm shift. Your camera feed never leaves the browser.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Niskala: posture and screen-fatigue cues', template: '%s · Niskala' },
  description,
  applicationName: 'Niskala',
  openGraph: { type: 'website', siteName: 'Niskala', title: 'Niskala', description },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4eee3' },
    { media: '(prefers-color-scheme: dark)', color: '#13141d' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${jakarta.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
