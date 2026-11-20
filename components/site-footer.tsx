import Link from 'next/link';
import { LogoMark } from './logo';

export default function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="flex items-center gap-2">
          <LogoMark className="size-4 text-accent" />
          Niskala. Built for Techcomfest 2027, SDG 3: Good Health and Well-being.
        </p>
        <nav aria-label="Footer" className="flex gap-5">
          <Link className="hover:text-ink" href="/app">
            Workspace
          </Link>
          <Link className="hover:text-ink" href="/insights">
            Insights
          </Link>
          <Link className="hover:text-ink" href="/privacy">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
