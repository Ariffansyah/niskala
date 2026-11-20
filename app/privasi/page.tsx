import type { Metadata } from 'next';
import Link from 'next/link';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import { IconCamera, IconEye, IconHistory, IconInfo, IconLock, IconShield } from '@/components/icons';
import SiteFooter from '@/components/site-footer';
import { Badge } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Privasi',
  description: 'Apa yang diproses Niskala, apa yang disimpan, dan apa yang bisa keluar dari perangkatmu.',
};

function Block({ icon: Icon, title, children }: { icon: ComponentType<SVGProps<SVGSVGElement>>; title: string; children: ReactNode }) {
  return (
    <section className="card grid gap-4 p-6 sm:grid-cols-[2.5rem_1fr]">
      <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
        <Icon />
      </span>
      <div>
        <h2 className="text-lg">{title}</h2>
        <div className="mt-2 space-y-3 text-pretty text-muted [&_strong]:font-semibold [&_strong]:text-ink">{children}</div>
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-8">
        <Badge icon={IconShield}>Privasi</Badge>
        <h1 className="mt-3 text-3xl sm:text-4xl">Kamera membantu, tanpa ada yang ikut melihat.</h1>
        <p className="mt-4 text-lg text-muted text-pretty">Halaman ini menjelaskan dengan tepat apa yang terjadi pada datamu.</p>
        <div className="mt-10 space-y-4">
          <Block icon={IconCamera} title="Kamera">
            <p>
              Kamera hanya menyala saat kamu menekan <strong>Nyalakan kamera</strong>, dan mati saat kamu menekan Matikan, berganti
              mode, atau menutup tab. Setiap frame dianalisis model wajah yang berjalan di browsermu, lalu dibuang.{' '}
              <strong>Tidak ada gambar, video, atau titik wajah yang diunggah atau disimpan.</strong>
            </p>
            <p>Model dan runtime-nya disajikan dari situs ini sendiri, jadi tidak ada server pihak ketiga yang dihubungi.</p>
          </Block>
          <Block icon={IconEye} title="Yang ada di memori">
            <p>
              Selama pelacakan berjalan, Niskala menyimpan beberapa angka per frame: sudut kepala, kemiringan garis mata, jarak antar
              mata di gambar, posisi wajah, dan apakah mata terpejam. Angka ini dipakai untuk tampilan langsung dan hilang saat kamu
              meninggalkan halaman.
            </p>
          </Block>
          <Block icon={IconHistory} title="Yang tersimpan di browsermu">
            <p>
              Di local storage browser ini: <strong>setelan</strong>, <strong>kalibrasi</strong> (lima angka yang menggambarkan posisi
              tegakmu), dan <strong>ringkasan sesi</strong> seperti menit aktif, menit condong, jeda yang diambil, dan rata-rata kedip.
              Semua itu menjadi bahan halaman Riwayat.
            </p>
            <p>
              Kamu bisa mengunduh atau menghapus semuanya dari tab Setelan di{' '}
              <Link href="/app" className="link text-ink">
                ruang kerja
              </Link>
              .
            </p>
          </Block>
          <Block icon={IconLock} title="Pencadangan opsional">
            <p>
              Jika situs ini dikonfigurasi dengan layanan pencadangan, ruang kerja menampilkan sakelar <strong>Cadangkan ringkasan</strong>.
              Bawaannya mati. Saat dinyalakan, ringkasan sesi dan setelan (jam tidur, layar hangat, jadwal jeda, kepekaan) dikirim ke
              basis data Supabase dengan ID anonim, dengan aturan yang hanya mengizinkan ID itu membaca barisnya. Kalibrasimu tidak
              pernah dikirim.
            </p>
          </Block>
          <Block icon={IconShield} title="Tanpa pelacakan dirimu">
            <p>Tidak ada analitik, skrip iklan, cookie, atau akun di situs ini.</p>
          </Block>
          <Block icon={IconInfo} title="Bukan nasihat medis">
            <p>
              Niskala memberi pengingat ergonomi dan kebersihan tidur yang umum. Ini bukan alat medis. Jika nyeri leher, punggung, atau
              mata terus berlanjut, temui tenaga kesehatan.
            </p>
          </Block>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
