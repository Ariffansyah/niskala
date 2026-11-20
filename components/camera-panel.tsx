'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from '@/lib/toast';
import { IconCamera, IconCheck, IconInfo, IconLock, IconRefresh } from './icons';
import { Badge } from './ui';

export type Camera =
  | { state: 'off' | 'starting' }
  | { state: 'on'; video: HTMLVideoElement }
  | { state: 'error'; error: string };

const CALIBRATE_MS = 4000;

export default function CameraPanel({ camera, onStart, onStop, calibrated, calibrate, previewElsewhere }: {
  camera: Camera;
  onStart: () => void;
  onStop: () => void;
  calibrated: boolean;
  calibrate: (ms: number) => Promise<boolean>;
  /** True while the preview lives in the mini monitor window. */
  previewElsewhere: boolean;
}) {
  const slot = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [calError, setCalError] = useState('');
  const video = camera.state === 'on' ? camera.video : null;

  useEffect(() => {
    if (!video || previewElsewhere || !slot.current) return;
    slot.current.append(video);
  }, [video, previewElsewhere]);

  async function runCalibration() {
    setCalError('');
    setProgress(0);
    const start = performance.now();
    const id = setInterval(() => setProgress(Math.min(1, (performance.now() - start) / CALIBRATE_MS)), 100);
    const ok = await calibrate(CALIBRATE_MS);
    clearInterval(id);
    setProgress(null);
    if (ok) toast('Kalibrasi tersimpan. Pelacakan postur dimulai.');
    else setCalError('Wajahmu kurang lama terlihat. Hadap ke layar dengan cahaya dari depan, lalu coba lagi.');
  }

  if (camera.state === 'off' || camera.state === 'error') {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 rounded-xl bg-surface p-4 text-sm">
          <IconLock className="mt-0.5 size-4 shrink-0 text-accent" />
          <p className="text-muted text-pretty">
            Setiap frame dianalisis di tab ini lalu dibuang. Yang disimpan hanya sudut kepala, ukuran wajah, dan waktu kedip,
            sebagai angka di memori.
          </p>
        </div>
        {camera.state === 'error' && (
          <p className="flex gap-2 text-sm text-alert-ink">
            <IconInfo className="mt-0.5 size-4 shrink-0" />
            {camera.error}
          </p>
        )}
        <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={onStart}>
          <IconCamera className="size-4" />
          {camera.state === 'error' ? 'Coba lagi' : 'Nyalakan kamera'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div
          ref={slot}
          className="grid aspect-[4/3] w-32 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface text-center text-xs text-muted sm:w-36 [&>video]:h-full [&>video]:w-full [&>video]:-scale-x-100 [&>video]:object-cover"
        >
          {camera.state === 'starting' && <span className="px-2">Menyalakan…</span>}
          {previewElsewhere && <span className="px-2">Pratinjau ada di monitor mini</span>}
        </div>
        <div className="space-y-2 text-sm">
          {camera.state === 'starting' ? (
            <p className="text-muted">Memuat model wajah (sekitar 4 MB, hanya pertama kali).</p>
          ) : calibrated ? (
            <>
              <Badge tone="accent" icon={IconCheck}>
                Terkalibrasi
              </Badge>
              <p className="text-muted">Kalibrasi ulang kalau kamera atau kursi berpindah.</p>
            </>
          ) : (
            <>
              <Badge tone="alert">Belum dikalibrasi</Badge>
              <p className="text-muted">Duduk tegak di jarak biasa, lihat ke layar, lalu tekan Kalibrasi.</p>
            </>
          )}
        </div>
      </div>
      {camera.state === 'on' && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={calibrated ? 'btn btn-sm' : 'btn btn-primary btn-sm'}
            onClick={runCalibration}
            disabled={progress !== null}
          >
            <IconRefresh className="size-4" />
            {progress === null
              ? calibrated
                ? 'Kalibrasi ulang (4 dtk)'
                : 'Kalibrasi (4 dtk)'
              : `Tahan posisi… ${Math.ceil((1 - progress) * (CALIBRATE_MS / 1000))}`}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onStop}>
            Matikan kamera
          </button>
        </div>
      )}
      {calError && <p className="text-sm text-alert-ink">{calError}</p>}
    </div>
  );
}
