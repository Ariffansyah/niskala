import Link from 'next/link';
import { IconArrowRight } from '@/components/icons';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-24 sm:px-8">
      <h1 className="max-w-3xl text-3xl sm:text-4xl">Halamannya nggak ketemu. Mungkin alamatnya salah ketik, atau halamannya udah pindah.</h1>
      <Link href="/" className="btn btn-primary mt-8">
        Balik ke beranda
        <IconArrowRight className="size-4" />
      </Link>
    </main>
  );
}
