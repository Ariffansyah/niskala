import Link from 'next/link';
import { Logo } from './logo';

const GROUPS = [
  {
    title: 'Produk',
    links: [
      { href: '/app', label: 'Ruang Kerja' },
      { href: '/riwayat', label: 'Riwayat' },
      { href: '/#cara-kerja', label: 'Cara kerja' },
    ],
  },
  {
    title: 'Kepercayaan',
    links: [
      { href: '/privasi', label: 'Privasi' },
      { href: '/#privasi', label: 'Yang tidak pernah dikirim' },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-surface/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-muted text-pretty">
            Pengingat postur, kedip, dan jam tidur untuk sesi layar yang panjang. Kamera diproses di browser kamu dan tidak
            pernah diunggah.
          </p>
          <p className="mt-4 text-[13px] text-muted">Techcomfest 2027 · SDG 3: Kehidupan Sehat dan Sejahtera</p>
        </div>
        {GROUPS.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <h2 className="text-sm">{g.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
