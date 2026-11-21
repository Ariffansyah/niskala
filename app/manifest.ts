import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Niskala',
    short_name: 'Niskala',
    description: 'Pengingat postur, kedip, dan jam tidur buat yang lama di depan layar. Jalan sepenuhnya di perangkatmu.',
    lang: 'id',
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
