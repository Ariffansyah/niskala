import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import {
  IconArrowRight,
  IconCamera,
  IconCheck,
  IconEye,
  IconLean,
  IconLock,
  IconMoon,
  IconPip,
  IconPosture,
  IconShield,
  IconTimer,
} from '@/components/icons';
import LandingDemo from '@/components/landing-demo';
import SiteFooter from '@/components/site-footer';
import { ROUTINES } from '@/lib/routines';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const SIGNALS: { icon: Icon; name: string; how: string; answer: string; tag?: string }[] = [
  {
    icon: IconPosture,
    name: 'Condong ke depan',
    how: 'Tinggi, ukuran, dan anggukan wajahmu dibandingkan dengan kalibrasi tegak selama 4 detik.',
    answer: 'Pendar kunyit di tepi layar, baru muncul setelah posisi itu bertahan sekitar sepuluh detik.',
  },
  {
    icon: IconLean,
    name: 'Miring ke samping',
    how: 'Pergeseran wajah ke kiri atau kanan, dan kemiringan garis kedua mata.',
    answer: 'Pendar yang sama, dengan arah yang jelas: badan miring ke kanan, atau kepala miring ke kiri.',
    tag: 'Baru',
  },
  {
    icon: IconEye,
    name: 'Laju kedip',
    how: 'Kelopak yang menutup dihitung per menit. Normalnya 15 sampai 20 kali, dan jauh lebih jarang saat menatap layar.',
    answer: 'Pendar saat kedipan bertahan di bawah sekitar sepuluh per menit, plus istirahat mata 20 detik.',
  },
  {
    icon: IconTimer,
    name: 'Lama di depan layar',
    how: 'Menit selama halaman ini atau monitor mininya terlihat. Tidak perlu kamera.',
    answer: 'Istirahat mata 20-20-20 dan peregangan 60 detik sesuai jadwal pilihanmu.',
  },
  {
    icon: IconMoon,
    name: 'Jam malam',
    how: 'Jam tidurmu, diatur sekali.',
    answer: 'Layar menghangat sejak dua jam sebelumnya, dengan saran jujur untuk mulai menutup pekerjaan.',
  },
];

const EXTRAS: { icon: Icon; title: string; body: string }[] = [
  { icon: IconPip, title: 'Monitor mini', body: 'Jendela kecil yang selalu di atas, jadi pemantauan tetap jalan saat kamu bekerja di aplikasi lain.' },
  { icon: IconCamera, title: 'Tanpa kamera pun bisa', body: 'Mode timer untuk jeda terjadwal, dan mode demo dengan slider untuk mencoba semuanya.' },
  { icon: IconLock, title: 'Data tetap milikmu', body: 'Riwayat tersimpan di browser. Unduh atau hapus kapan saja, tanpa akun.' },
];

const STAYS = [
  'Frame kamera, yang dianalisis di tab lalu dibuang',
  'Titik wajah dan waktu kedip',
  'Kalibrasi posisi tegakmu',
  'Semua setelan dan ringkasan sesi, kecuali kamu menyalakan pencadangan',
];
const CAN_LEAVE = [
  'Ringkasan sesi yang dibulatkan: menit aktif, menit condong, jeda, rata-rata kedip',
  'Setelan: jam tidur, layar hangat, jadwal jeda, kepekaan',
  'Hanya setelah kamu menyalakan “Cadangkan ringkasan”, dengan ID anonim',
];

export default function Home() {
  const reset = ROUTINES.reset;
  return (
    <>
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-x-14 gap-y-10 px-4 pt-10 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:pt-14">
          <div>
            <h1 className="text-4xl leading-[1.08] sm:text-5xl lg:text-[3.6rem]">Lihat pegal sebelum terasa.</h1>
            <p className="mt-6 max-w-xl text-lg text-muted text-pretty">
              Niskala membaca cara kamu duduk dan berkedip lewat webcam, sepenuhnya di dalam browser. Saat badan condong, miring, atau
              mata lupa berkedip terlalu lama, tepi layar berpendar hangat. Tanpa pop-up, tanpa unggahan, tanpa akun.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/app" className="btn btn-primary btn-lg">
                Buka ruang kerja
                <IconArrowRight className="size-4" />
              </Link>
              <Link href="#cara-kerja" className="btn btn-lg">
                Cara kerjanya
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-2 text-[13px]">
              {['Diproses di perangkat', 'Tanpa akun', 'Bisa tanpa kamera'].map((t) => (
                <li key={t} className="badge badge-neutral py-1.5">
                  <IconCheck className="size-3.5 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <LandingDemo />
        </section>

        <section id="cara-kerja" className="border-t border-rule bg-surface/50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
            <p className="badge badge-accent">Cara kerja</p>
            <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl">Lima hal yang diperhatikan, dan cara menanggapinya.</h2>
            <div className="mt-10 overflow-hidden rounded-2xl border border-rule bg-raised">
              <div className="hidden grid-cols-[16rem_1fr_1fr] gap-x-8 border-b border-rule bg-surface/60 px-6 py-3 text-[13px] font-semibold text-muted md:grid">
                <span>Yang dibaca</span>
                <span>Cara mengukurnya</span>
                <span>Tanggapan Niskala</span>
              </div>
              <dl className="divide-y divide-rule">
                {SIGNALS.map((s) => (
                  <div key={s.name} className="grid gap-x-8 gap-y-2 px-6 py-5 md:grid-cols-[16rem_1fr_1fr]">
                    <dt className="flex items-start gap-3 font-semibold">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                        <s.icon />
                      </span>
                      <span className="pt-1.5">
                        {s.name}
                        {s.tag && <span className="badge badge-alert ml-2 align-middle">{s.tag}</span>}
                      </span>
                    </dt>
                    <dd className="text-muted text-pretty md:pt-1.5">{s.how}</dd>
                    <dd className="text-pretty md:pt-1.5">{s.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {EXTRAS.map((e) => (
                <div key={e.title} className="card flex gap-4 p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-accent">
                    <e.icon />
                  </span>
                  <div>
                    <h3 className="font-bold">{e.title}</h3>
                    <p className="mt-1 text-sm text-muted text-pretty">{e.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-x-14 gap-y-10 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <p className="badge badge-accent">Peregangan 60 detik</p>
            <h2 className="mt-3 text-3xl sm:text-4xl">Satu menit untuk menebus satu jam.</h2>
            <p className="mt-5 max-w-md text-muted text-pretty">
              Dipandu dan diberi waktu, langkah demi langkah. Dengan kamera menyala, Niskala memeriksa apakah kepalamu benar-benar
              kembali sejajar bahu, mengukur miringnya leher saat peregangan samping, dan menghitung kedipanmu.
            </p>
            <Link href="/app" className="btn mt-8">
              Coba peregangannya
              <IconArrowRight className="size-4" />
            </Link>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {reset.steps.map((s, i) => (
              <li key={s.title} className="card p-5">
                <div className="flex items-center justify-between">
                  <span className="grid size-8 place-items-center rounded-full bg-accent text-sm font-bold text-on-accent">{i + 1}</span>
                  <span className="badge badge-neutral">{s.seconds} dtk</span>
                </div>
                <h3 className="mt-4 text-lg">{s.title}</h3>
                <p className="mt-1 text-sm text-muted text-pretty">{s.how}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="privasi" className="border-t border-rule bg-surface/50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
            <p className="badge badge-accent">
              <IconShield className="size-3.5" />
              Privasi
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl">Rekaman kameramu tidak pernah keluar dari tab.</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="card p-6">
                <h3 className="flex items-center gap-2 text-lg">
                  <IconLock className="size-5 text-accent" />
                  Tetap di perangkatmu
                </h3>
                <ul className="mt-4 space-y-3 text-muted">
                  {STAYS.map((x) => (
                    <li key={x} className="flex gap-3">
                      <IconCheck className="mt-1 size-4 shrink-0 text-accent" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-6">
                <h3 className="flex items-center gap-2 text-lg">
                  <IconShield className="size-5 text-muted" />
                  Bisa keluar, hanya jika kamu izinkan
                </h3>
                <ul className="mt-4 space-y-3 text-muted">
                  {CAN_LEAVE.map((x) => (
                    <li key={x} className="flex gap-3">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-edge" aria-hidden />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-8 text-sm text-muted">
              Model wajah dan runtime-nya disajikan dari situs ini sendiri, jadi CDN pun tidak tahu kamu memakainya.{' '}
              <Link href="/privasi" className="link text-ink">
                Baca catatan privasi
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
          <div className="card grid gap-x-14 gap-y-8 overflow-hidden p-8 sm:p-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <h2 className="text-3xl sm:text-4xl">
              <span className="text-muted">Sekala,</span> niskala.
            </h2>
            <div className="space-y-4 text-lg text-pretty">
              <p>
                Dalam pandangan Bali, <em>sekala</em> adalah dunia yang terlihat dan teraba, sedangkan <em>niskala</em> adalah yang tak
                kasat mata, namun tetap membentuk segalanya.
              </p>
              <p className="text-muted">
                Kerja di depan layar juga punya sisi tak terlihat: punggung yang membungkuk sedikit demi sedikit, mata yang lupa
                berkedip, satu jam yang menjadi tiga. Niskala menjaga sisi itu tetap terlihat, lalu menyingkir.
              </p>
              <Link href="/app" className="btn btn-primary mt-4">
                Buka ruang kerja
                <IconArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
