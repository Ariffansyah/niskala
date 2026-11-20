import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import {
  IconArrowRight,
  IconCamera,
  IconCheck,
  IconEye,
  IconLock,
  IconMoon,
  IconPip,
  IconPosture,
  IconShield,
  IconTimer,
} from '@/components/icons';
import LandingDemo from '@/components/landing-demo';
import PostureFigure, { FrontFigure } from '@/components/posture-figure';
import SiteFooter from '@/components/site-footer';
import { ROUTINES } from '@/lib/routines';
import { UPRIGHT } from '@/lib/signals';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const SMALL_SIGNALS: { icon: Icon; name: string; how: string; answer: string }[] = [
  {
    icon: IconEye,
    name: 'Laju kedip',
    how: 'Normalnya 15 sampai 20 kali per menit, dan jauh lebih jarang saat menatap layar.',
    answer: 'Pendar saat kedipan bertahan di bawah sekitar sepuluh per menit, plus istirahat mata 20 detik.',
  },
  {
    icon: IconTimer,
    name: 'Lama di depan layar',
    how: 'Menit selama halaman ini atau monitor mininya terlihat. Tanpa kamera pun jalan.',
    answer: 'Istirahat mata 20-20-20 dan peregangan 60 detik sesuai jadwalmu.',
  },
  {
    icon: IconPosture,
    name: 'Saat kamu menjauh',
    how: 'Kamera melihat kursimu kosong lebih dari satu menit.',
    answer: 'Waktu itu dihitung sebagai jeda, bukan waktu layar, dan pengingat ikut menyesuaikan.',
  },
  {
    icon: IconMoon,
    name: 'Jam malam',
    how: 'Jam tidurmu, diatur sekali.',
    answer: 'Layar menghangat sejak dua jam sebelumnya, dengan saran jujur untuk mulai menutup pekerjaan.',
  },
];

const CAMERAS = [
  {
    title: 'Kamera depan',
    where: 'Webcam laptop, di atas layar',
    reads: ['Condong ke depan', 'Miring ke samping', 'Kepala miring', 'Laju kedip'],
    misses: [] as string[],
    front: true,
  },
  {
    title: 'Kamera samping',
    where: 'Webcam USB atau ponsel, setinggi bahu di sisi meja',
    reads: ['Sudut leher, lebih akurat', 'Sudut punggung, lebih akurat'],
    misses: ['Miring ke samping', 'Laju kedip'],
    front: false,
  },
];

const STAYS = [
  'Frame kamera, yang dianalisis di tab lalu dibuang',
  'Titik wajah, titik tubuh, dan waktu kedip',
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
        <section className="mx-auto grid max-w-6xl items-center gap-x-16 gap-y-12 px-4 pt-10 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:pt-16">
          <div>
            <h1 className="text-[2.6rem] leading-[1.05] font-extrabold sm:text-6xl lg:text-[3.7rem]">
              Lihat <span className="marker">pegal</span> sebelum terasa.
            </h1>
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
          </div>
          <LandingDemo />
        </section>

        <section id="cara-kerja" className="band motif-kawung">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-24">
            <h2 className="max-w-2xl text-3xl sm:text-[2.6rem] sm:leading-tight">Enam hal yang diperhatikan, dan cara menanggapinya.</h2>
            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <article className="band-card overflow-hidden">
                <div className="h-60 bg-white/[0.04] p-3">
                  <PostureFigure posture={{ ...UPRIGHT, torso: 0.75, head: 0.85 }} className="drop-shadow-xl" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl">Condong ke depan</h3>
                  <p className="mt-2 text-on-band-muted text-pretty">
                    Dari kamera depan: tinggi, ukuran, dan anggukan wajah. Dari kamera samping: sudut leher dan punggung secara
                    langsung. Semuanya dibandingkan dengan kalibrasi tegak 4 detik.
                  </p>
                  <p className="mt-4 flex gap-2 text-pretty">
                    <IconArrowRight className="mt-1 size-4 shrink-0 text-band-accent" />
                    Pendar kunyit di tepi layar, baru muncul setelah posisi itu bertahan sekitar sepuluh detik.
                  </p>
                </div>
              </article>
              <article className="band-card overflow-hidden">
                <div className="h-60 bg-white/[0.04] p-3">
                  <FrontFigure posture={{ ...UPRIGHT, side: 0.85, tilt: -0.35 }} className="drop-shadow-xl" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl">Miring ke samping</h3>
                  <p className="mt-2 text-on-band-muted text-pretty">
                    Pergeseran wajah ke kiri atau kanan dan kemiringan garis kedua mata. Menoleh ke monitor kedua tidak dihitung
                    sebagai miring.
                  </p>
                  <p className="mt-4 flex gap-2 text-pretty">
                    <IconArrowRight className="mt-1 size-4 shrink-0 text-band-accent" />
                    Pendar yang sama, dengan arah yang jelas: badan miring ke kanan, atau kepala miring ke kiri.
                  </p>
                </div>
              </article>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {SMALL_SIGNALS.map((s) => (
                <article key={s.name} className="band-card p-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-band-accent">
                    <s.icon />
                  </span>
                  <h3 className="mt-4 text-lg">{s.name}</h3>
                  <p className="mt-2 text-on-band-muted text-pretty">{s.how}</p>
                  <p className="mt-3 text-pretty">{s.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-[2.6rem] sm:leading-tight">Kamera di depan atau di samping, dua-duanya bisa.</h2>
            <p className="mt-4 text-muted text-pretty">
              Webcam laptop sudah cukup. Punya kamera kedua? Taruh di samping meja: dari situ sudut leher dan punggung terbaca
              langsung, seperti saat fisioterapis menilai postur.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {CAMERAS.map((c) => (
              <article key={c.title} className="card grid overflow-hidden sm:grid-cols-[11rem_1fr]">
                <div className="stage grid place-items-center border-b border-rule p-3 sm:border-r sm:border-b-0">
                  <div className={c.front ? 'h-44 sm:h-full' : 'h-44 w-full sm:h-auto'}>
                    {c.front ? <FrontFigure posture={null} /> : <PostureFigure posture={{ ...UPRIGHT, torso: 0.35, head: 0.5 }} />}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="flex items-center gap-2 text-xl">
                    <IconCamera className="size-5 text-accent" />
                    {c.title}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {c.reads.map((r) => (
                      <li key={r} className="flex items-center gap-2">
                        <span className="grid size-5 place-items-center rounded-full bg-accent-soft text-accent">
                          <IconCheck className="size-3" />
                        </span>
                        {r}
                      </li>
                    ))}
                    {c.misses.map((r) => (
                      <li key={r} className="flex items-center gap-2 text-muted line-through decoration-edge">
                        <span className="grid size-5 place-items-center rounded-full bg-surface">
                          <span className="h-0.5 w-2 rounded-full bg-edge" />
                        </span>
                        {r}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 border-t border-rule pt-4 text-muted">{c.where}.</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-rule bg-surface/60">
          <div className="mx-auto grid max-w-6xl gap-x-16 gap-y-10 px-4 py-20 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <h2 className="text-3xl sm:text-[2.6rem] sm:leading-tight">Satu menit untuk menebus satu jam.</h2>
              <p className="mt-5 max-w-md text-muted text-pretty">
                Dipandu dan diberi waktu, langkah demi langkah. Dengan kamera menyala, Niskala memeriksa apakah kepalamu benar-benar
                kembali sejajar bahu, mengukur miringnya leher saat peregangan samping, dan menghitung kedipanmu.
              </p>
              <Link href="/app" className="btn mt-8">
                Coba peregangannya
                <IconArrowRight className="size-4" />
              </Link>
            </div>
            <ol className="relative space-y-3 before:absolute before:top-6 before:bottom-6 before:left-[1.4rem] before:w-px before:bg-rule">
              {reset.steps.map((s, i) => (
                <li key={s.title} className="relative flex gap-5">
                  <span className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full bg-accent text-base font-extrabold text-on-accent ring-4 ring-surface">
                    {i + 1}
                  </span>
                  <div className="card flex-1 p-5">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-lg">{s.title}</h3>
                      <span className="badge badge-neutral">{s.seconds} dtk</span>
                    </div>
                    <p className="mt-1 text-muted text-pretty">{s.how}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="privasi" className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-24">
          <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <h2 className="text-3xl sm:text-[2.6rem] sm:leading-tight">Rekaman kameramu tidak pernah keluar dari tab.</h2>
              <p className="mt-5 text-muted text-pretty">
                Model wajah dan tubuh beserta runtime-nya disajikan dari situs ini sendiri, jadi CDN pun tidak tahu kamu memakainya.
              </p>
              <Link href="/privasi" className="btn mt-8">
                Baca catatan privasi
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="card p-6">
                <h3 className="flex items-center gap-2 text-lg">
                  <IconLock className="size-5 text-accent" />
                  Tetap di perangkatmu
                </h3>
                <ul className="mt-4 space-y-3 text-muted">
                  {STAYS.map((x) => (
                    <li key={x} className="flex gap-3">
                      <IconCheck className="mt-0.5 size-4 shrink-0 text-accent" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-6">
                <h3 className="flex items-center gap-2 text-lg">
                  <IconShield className="size-5 text-muted" />
                  Keluar hanya jika kamu izinkan
                </h3>
                <ul className="mt-4 space-y-3 text-muted">
                  {CAN_LEAVE.map((x) => (
                    <li key={x} className="flex gap-3">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-edge" aria-hidden />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card flex gap-4 p-6 sm:col-span-2">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-accent">
                  <IconPip />
                </span>
                <p className="text-muted text-pretty">
                  Punya dua monitor? <span className="font-semibold text-ink">Jendela mengambang</span> bisa diseret ke layar tempat kamu
                  bekerja, dan notifikasi desktop jadi cadangannya. Semuanya tetap tanpa mengirim apa pun.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="band motif-kawung">
          <div className="mx-auto grid max-w-6xl items-center gap-x-16 gap-y-8 px-4 py-20 sm:px-8 sm:py-24 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <h2 className="text-4xl sm:text-5xl">
              <span className="text-on-band-muted">Sekala,</span> niskala.
            </h2>
            <div className="space-y-4 text-lg text-pretty">
              <p>
                Dalam pandangan Bali, <em>sekala</em> adalah dunia yang terlihat dan teraba, sedangkan <em>niskala</em> adalah yang tak
                kasat mata, namun tetap membentuk segalanya.
              </p>
              <p className="text-on-band-muted">
                Kerja di depan layar juga punya sisi tak terlihat: punggung yang membungkuk sedikit demi sedikit, mata yang lupa
                berkedip, satu jam yang menjadi tiga. Niskala menjaga sisi itu tetap terlihat, lalu menyingkir.
              </p>
              <Link href="/app" className="btn btn-lg mt-4 border-band-accent bg-band-accent text-[#1c2643] hover:border-on-band hover:bg-on-band">
                Mulai sekarang, gratis
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
