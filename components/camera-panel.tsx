'use client';

import { useEffect, useRef, useState } from 'react';

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
    if (!ok) setCalError('Your face was not in view long enough. Face the screen with light in front of you, then try again.');
  }

  if (camera.state === 'off' || camera.state === 'error') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">
          Frames are analysed inside this tab. Only head angle, face size and blink timing are kept, as numbers in memory.
        </p>
        {camera.state === 'error' && <p className="text-sm text-alert-ink">{camera.error}</p>}
        <button type="button" className="btn btn-primary" onClick={onStart}>
          {camera.state === 'error' ? 'Try again' : 'Start camera'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div
          ref={slot}
          className="grid aspect-[4/3] w-32 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface text-center text-xs text-muted sm:w-36 [&>video]:h-full [&>video]:w-full [&>video]:-scale-x-100 [&>video]:object-cover"
        >
          {camera.state === 'starting' && <span className="px-2">Starting…</span>}
          {previewElsewhere && <span className="px-2">Preview is in the mini monitor</span>}
        </div>
        <div className="space-y-2 text-sm">
          {camera.state === 'starting' ? (
            <p className="text-muted">Loading the face model (about 4 MB, first time only).</p>
          ) : (
            <p>
              {calibrated
                ? 'Calibrated. Recalibrate if you move the camera or change chairs.'
                : 'Sit upright at your usual distance, look at the screen, then calibrate.'}
            </p>
          )}
        </div>
      </div>
      {camera.state === 'on' && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={calibrated ? 'btn' : 'btn btn-primary'}
            onClick={runCalibration}
            disabled={progress !== null}
          >
            {progress === null
              ? calibrated
                ? 'Recalibrate (4 s)'
                : 'Calibrate (4 s)'
              : `Hold still… ${Math.ceil((1 - progress) * (CALIBRATE_MS / 1000))}`}
          </button>
          <button type="button" className="btn-quiet ml-1" onClick={onStop}>
            Stop camera
          </button>
        </div>
      )}
      {calError && <p className="text-sm text-alert-ink">{calError}</p>}
    </div>
  );
}
