import Link from 'next/link';
import { IconArrowRight } from '@/components/icons';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-24 sm:px-8">
      <p className="badge badge-neutral">404</p>
      <h1 className="mt-4 text-3xl sm:text-4xl">Halaman ini tidak terlihat.</h1>
      <p className="mt-4 text-muted">Alamatnya mungkin salah ketik, atau halamannya sudah pindah.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/app" className="btn btn-primary">
          Buka ruang kerja
          <IconArrowRight className="size-4" />
        </Link>
        <Link href="/" className="btn">
          Ke beranda
        </Link>
      </div>
    </main>
  );
}
