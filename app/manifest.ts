import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Niskala',
    short_name: 'Niskala',
    description: 'Posture, blink and bedtime cues for long screen sessions. Runs entirely on your device.',
    start_url: '/app',
    display: 'standalone',
    background_color: '#f4eee3',
    theme_color: '#2c3f6b',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
