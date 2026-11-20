import Link from 'next/link';
import { Logo } from './logo';
import ThemeToggle from './theme-toggle';

const NAV = [
  { href: '/app', label: 'Workspace', key: 'app' },
  { href: '/insights', label: 'Insights', key: 'insights' },
  { href: '/privacy', label: 'Privacy', key: 'privacy' },
] as const;

export default function SiteHeader({ current }: { current?: 'home' | (typeof NAV)[number]['key'] }) {
  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 sm:px-8">
      <Link href="/" aria-label="Niskala home" className="rounded-md">
        <Logo />
      </Link>
      <nav aria-label="Main" className="flex items-center gap-x-4 text-sm sm:gap-x-6">
        {NAV.map((n) => (
          <Link
            key={n.key}
            href={n.href}
            aria-current={current === n.key ? 'page' : undefined}
            className="py-2 font-medium text-muted transition-colors hover:text-ink aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-accent aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
          >
            {n.label}
          </Link>
        ))}
        <ThemeToggle />
      </nav>
    </header>
  );
}
