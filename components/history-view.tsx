'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { minutes } from '@/lib/format';
import { byDay, totals, type Day } from '@/lib/insights';
import { exportData, sessionsStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { IconArrowRight, IconDownload, IconEye, IconHistory, IconMoon, IconPosture, IconStretch, IconTimer } from './icons';
import { Stat } from './ui';
import { Segmented } from './ui-client';

const noop = () => () => {};
const RANGES = [7, 14, 30] as const;
const SOURCE: Record<string, string> = { camera: 'Kamera', timer: 'Timer', simulation: 'Demo' };

const dayLabel = (d: Date) => d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function download() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }));
  a.download = 'niskala-data.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Data diunduh sebagai niskala-data.json.');
}

function Chart({ days }: { days: Day[] }) {
  const max = Math.max(...days.map((d) => d.active_s), 1);
  const every = days.length > 14 ? 5 : 1;
  return (
    <figure className="card p-5 sm:p-6">
      <figcaption className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <p className="font-bold">Waktu di layar per hari, dan berapa lama di antaranya kamu condong atau miring</p>
        <div className="flex gap-4 text-[13px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-accent" /> tegak
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-alert" /> condong / miring
          </span>
        </div>
      </figcaption>
      <div className="mt-6 flex gap-3">
        <div className="flex h-52 flex-col justify-between text-right text-[11px] text-muted tabular-nums" aria-hidden>
          <span>{minutes(max)}</span>
          <span>{minutes(max / 2)}</span>
          <span>0</span>
        </div>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-52 border-t border-dashed border-rule" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 top-26 border-t border-dashed border-rule" aria-hidden />
          <ol className="relative flex h-52 items-end gap-[3px] border-b border-edge sm:gap-1.5" aria-hidden>
            {days.map((d) => {
              const h = (d.active_s / max) * 100;
              const lean = d.active_s ? (d.slouch_s / d.active_s) * 100 : 0;
              return (
                <li key={d.key} className="group flex h-full flex-1 flex-col justify-end" title={`${dayLabel(d.date)}: ${minutes(d.active_s)}, ${pct(d.slouch_s, d.active_s)}% condong`}>
                  <div className="flex flex-col overflow-hidden rounded-t-md transition-opacity group-hover:opacity-80" style={{ height: `${h}%` }}>
                    <div className="flex-1 bg-accent" />
                    <div className="bg-alert" style={{ height: `${lean}%` }} />
                  </div>
                </li>
              );
            })}
          </ol>
          <ol className="mt-2 flex gap-[3px] text-center text-[11px] text-muted tabular-nums sm:gap-1.5" aria-hidden>
            {days.map((d, i) => (
              <li key={d.key} className="flex-1">
                {(days.length - 1 - i) % every === 0 ? d.date.getDate() : ''}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <table className="sr-only">
        <caption>Waktu di layar dan waktu condong per hari</caption>
        <thead>
          <tr>
            <th>Hari</th>
            <th>Waktu di layar</th>
            <th>Condong atau miring</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.key}>
              <td>{dayLabel(d.date)}</td>
              <td>{minutes(d.active_s)}</td>
              <td>{minutes(d.slouch_s)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default function HistoryView() {
  const sessions = useSyncExternalStore(sessionsStore.subscribe, sessionsStore.get, sessionsStore.server);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [range, setRange] = useState<(typeof RANGES)[number]>(14);

  if (!hydrated) return <p className="py-10 text-muted">Membaca riwayat dari browser ini…</p>;

  const days = byDay(sessions, range, new Date());
  const t = totals(days);
  const active = days.filter((d) => d.active_s >= 600);
  const best = active.length > 1 ? active.reduce((a, b) => (b.slouch_s / b.active_s < a.slouch_s / a.active_s ? b : a)) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl">Riwayat {range} hari terakhir</h1>
        <Segmented
          label="Rentang"
          value={range}
          onChange={setRange}
          options={RANGES.map((r) => ({ value: r, label: `${r} hari` }))}
        />
      </div>

      {t.activeDays === 0 ? (
        <div className="card grid place-items-center px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-surface text-accent">
            <IconHistory className="size-7" />
          </span>
          <p className="mt-5 max-w-md text-lg text-pretty">
            Belum ada sesi di rentang ini. Sesi lebih dari 30 detik di ruang kerja tersimpan otomatis di sini, dalam mode apa pun.
          </p>
          <Link href="/app" className="btn btn-primary mt-6">
            Buka ruang kerja
            <IconArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="card grid gap-x-8 px-5 py-1 md:grid-cols-2 [&>*]:border-b [&>*]:border-rule md:[&>*:nth-last-child(-n+2)]:border-b-0 [&>*:last-child]:border-b-0">
            <Stat icon={IconTimer} hue="hue-kunyit" label="Waktu di layar" value={minutes(t.active_s)} detail={`dalam ${t.activeDays} hari`} />
            <Stat icon={IconPosture} label="Condong atau miring" value={`${Math.round(t.leanShare * 100)}%`} detail={minutes(t.slouch_s)} tone={t.leanShare > 0.25 ? 'alert' : undefined} />
            <Stat icon={IconStretch} hue="hue-mengkudu" label="Jeda diambil" value={String(t.resets + t.eye_breaks)} detail={`${t.resets} peregangan, ${t.eye_breaks} mata`} />
            <Stat icon={IconEye} hue="hue-daun" label="Rata-rata kedip" value={t.blink === null ? 'Belum ada' : `${Math.round(t.blink)}/mnt`} />
            <Stat icon={IconMoon} hue="hue-ungu" label="Lewat jam tidur" value={minutes(t.late_s)} />
            <Stat icon={IconHistory} label="Disimpan di" value="browser ini" detail="tidak dikirim" />
          </div>

          <Chart days={days} />

          {best && (
            <div className="card flex items-center gap-4 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                <IconPosture />
              </span>
              <p className="text-pretty">
                Hari paling tegakmu adalah <strong>{dayLabel(best.date)}</strong>: condong hanya {pct(best.slouch_s, best.active_s)}% dari{' '}
                {minutes(best.active_s)}.
              </p>
            </div>
          )}

          <section className="card overflow-hidden">
            <h2 className="px-5 pt-5 text-lg">Sesi terbaru</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm tabular-nums">
                <thead className="bg-surface/60 text-[13px] text-muted">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Mulai</th>
                    <th className="py-2.5 pr-4 font-medium">Durasi</th>
                    <th className="py-2.5 pr-4 font-medium">Condong</th>
                    <th className="py-2.5 pr-4 font-medium">Jeda</th>
                    <th className="py-2.5 pr-5 font-medium">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 12).map((s) => (
                    <tr key={s.id} className="border-t border-rule">
                      <td className="px-5 py-3">
                        {new Date(s.started_at).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 pr-4">{minutes(s.active_s)}</td>
                      <td className="py-3 pr-4">
                        <span className={pct(s.slouch_s, s.active_s) > 25 ? 'font-semibold text-alert-ink' : ''}>{pct(s.slouch_s, s.active_s)}%</span>
                      </td>
                      <td className="py-3 pr-4">{s.resets + s.eye_breaks}</td>
                      <td className="py-3 pr-5">
                        <span className="badge badge-neutral">{SOURCE[s.source] ?? s.source}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <button type="button" className="btn btn-sm" onClick={download}>
        <IconDownload className="size-4" />
        Unduh semua data (JSON)
      </button>
    </div>
  );
}
