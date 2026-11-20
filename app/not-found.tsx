import Link from 'next/link';
import SiteHeader from '@/components/site-header';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-24 sm:px-8">
        <h1 className="text-3xl sm:text-4xl">This page is out of view.</h1>
        <p className="mt-4 text-muted">The address may be mistyped, or the page has moved.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/app" className="btn btn-primary">
            Open the workspace
          </Link>
          <Link href="/" className="btn">
            Go to the home page
          </Link>
        </div>
      </main>
    </>
  );
}
