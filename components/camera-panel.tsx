'use client';

import { useEffect, useRef, useState } from 'react';
import type { CameraView } from '@/lib/store';
import { toast } from '@/lib/toast';
import { IconCamera, IconCheck, IconInfo, IconLock, IconRefresh } from './icons';
import { Badge } from './ui';
import { Segmented } from './ui-client';

export type Camera =
  | { state: 'off' | 'starting' }
  | { state: 'on'; video: HTMLVideoElement }
  | { state: 'error'; error: string };

const CALIBRATE_MS = 4000;

const PLACEMENT: Record<CameraView, { title: string; body: string; reads: string; misses?: string }> = {
  front: {
    title: 'Kamera di atas layar',
    body: 'Sejajar mata, seperti webcam laptop biasa.',
    reads: 'Condong ke depan, miring ke samping, kepala miring, dan kedipan.',
  },
  side: {
    title: 'Kamera di samping',
    body: 'Di kiri atau kanan, setinggi bahu, 1 sampai 2 meter dari kursi, sampai telinga, bahu, dan pinggul terlihat.',
    reads: 'Sudut leher dan punggung secara langsung, lebih akurat untuk condong ke depan.',
    misses: 'Miring ke samping dan kedipan tidak terukur dari posisi ini.',
  },
};

export default function CameraPanel({ camera, onStart, onStop, calibrated, calibrate, previewElsewhere, view, onViewChange, cameras, cameraId, onCameraChange }: {
  camera: Camera;
  onStart: () => void;
  onStop: () => void;
  calibrated: boolean;
  calibrate: (ms: number) => Promise<boolean>;
  /** True while the preview lives in the mini monitor window. */
  previewElsewhere: boolean;
  view: CameraView;
  onViewChange: (v: CameraView) => void;
  cameras: { id: string; label: string }[];
  cameraId: string | null;
  onCameraChange: (id: string | null) => void;
}) {
  const slot = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [calError, setCalError] = useState('');
  const video = camera.state === 'on' ? camera.video : null;
  const place = PLACEMENT[view];

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
    else
      setCalError(
        view === 'front'
          ? 'Wajahmu kurang lama terlihat. Hadap ke layar dengan cahaya dari depan, lalu coba lagi.'
          : 'Telinga, bahu, dan pinggul kurang lama terlihat. Mundurkan kamera atau naikkan sedikit, lalu coba lagi.',
      );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="label">Posisi kamera</p>
        <Segmented<CameraView>
          label="Posisi kamera"
          value={view}
          onChange={onViewChange}
          options={[
            { value: 'front', label: 'Depan' },
            { value: 'side', label: 'Samping' },
          ]}
        />
        <div className="rounded-xl bg-surface p-4 text-sm">
          <p className="font-semibold">{place.title}</p>
          <p className="mt-1 text-muted text-pretty">{place.body}</p>
          <p className="mt-3 flex gap-2 text-pretty">
            <IconCheck className="mt-0.5 size-4 shrink-0 text-accent" />
            {place.reads}
          </p>
          {place.misses && (
            <p className="mt-1.5 flex gap-2 text-muted text-pretty">
              <IconInfo className="mt-0.5 size-4 shrink-0" />
              {place.misses}
            </p>
          )}
        </div>
        {cameras.length > 1 && (
          <label className="block">
            <span className="label block">Kamera yang dipakai</span>
            <select
              value={cameraId ?? ''}
              onChange={(e) => onCameraChange(e.target.value || null)}
              className="field mt-1 w-full text-sm"
            >
              <option value="">Bawaan browser</option>
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {camera.state === 'off' || camera.state === 'error' ? (
        <div className="space-y-4 border-t border-rule pt-5">
          <p className="flex gap-3 text-sm text-muted text-pretty">
            <IconLock className="mt-0.5 size-4 shrink-0 text-accent" />
            Setiap frame dianalisis di tab ini lalu dibuang. Yang disimpan hanya sudut dan waktu kedip, sebagai angka di memori.
          </p>
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
      ) : (
        <div className="space-y-4 border-t border-rule pt-5">
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
                <p className="text-muted">Memuat model {view === 'front' ? 'wajah (4 MB)' : 'tubuh (6 MB)'}, hanya pertama kali.</p>
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
                  <p className="text-muted">Duduk tegak di posisi kerja biasa, lalu tekan Kalibrasi.</p>
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
      )}
    </div>
  );
}
