'use client';

import { useEffect, useRef, useState } from 'react';
import { makeBaseline, type Baseline, type FaceSample } from '@/lib/signals';
import { startVision } from '@/lib/vision';

const CALIBRATE_MS = 4000;
const MIN_CALIBRATION_FRAMES = 20;

function describe(e: unknown) {
  const name = e instanceof DOMException ? e.name : '';
  if (name === 'NotAllowedError') return 'Camera access was blocked. Allow it from the address bar, or keep using Simulation.';
  if (name === 'NotFoundError') return 'No camera was found on this device. Simulation still works.';
  if (name === 'NotReadableError') return 'The camera is in use by another app. Close it and switch back to Camera.';
  return `The vision module could not start: ${e instanceof Error ? e.message : String(e)}`;
}

export default function CameraPanel({ calibrated, onSample, onBaseline }: {
  calibrated: boolean;
  onSample: (s: FaceSample | null, t: number) => void;
  onBaseline: (b: Baseline) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const collected = useRef<FaceSample[] | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  const [status, setStatus] = useState<'starting' | 'running' | 'error'>('starting');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [calError, setCalError] = useState('');

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    startVision(video.current!, (s, t) => {
      if (s) collected.current?.push(s);
      onSample(s, t);
    }).then(
      (fn) => {
        if (cancelled) return fn();
        stop = fn;
        setStatus('running');
      },
      (e) => {
        if (cancelled) return;
        setError(describe(e));
        setStatus('error');
      },
    );
    return () => {
      cancelled = true;
      clearInterval(timer.current);
      stop?.();
    };
  }, [onSample]);

  function calibrate() {
    collected.current = [];
    setCalError('');
    setProgress(0);
    const start = performance.now();
    timer.current = setInterval(() => {
      const p = (performance.now() - start) / CALIBRATE_MS;
      if (p < 1) return setProgress(p);
      clearInterval(timer.current);
      const got = collected.current ?? [];
      collected.current = null;
      setProgress(null);
      if (got.length < MIN_CALIBRATION_FRAMES) {
        setCalError('Your face was not in view long enough. Face the screen with light in front of you, then try again.');
      } else {
        onBaseline(makeBaseline(got));
      }
    }, 100);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <video
          ref={video}
          muted
          playsInline
          width={160}
          height={120}
          className="aspect-[4/3] w-32 shrink-0 -scale-x-100 rounded-md bg-rule object-cover sm:w-40"
          aria-label="Your camera preview, shown only on this screen"
        />
        <p className="text-sm text-muted">
          {status === 'starting' && 'Starting the camera and loading the face model (about 4 MB, first time only)…'}
          {status === 'running' &&
            'Frames are analysed in this tab. Only head angle, face size and blink timing are kept, as numbers in memory.'}
          {status === 'error' && <span className="text-ink">{error}</span>}
        </p>
      </div>

      {status === 'running' && (
        <div className="space-y-2">
          <p className="text-sm">
            {calibrated
              ? 'Calibrated. Recalibrate if you move the camera or change chairs.'
              : 'Sit upright at your usual distance and look at the screen, then calibrate.'}
          </p>
          <button type="button" className="btn" onClick={calibrate} disabled={progress !== null}>
            {progress === null
              ? calibrated
                ? 'Recalibrate (4 s)'
                : 'Calibrate (4 s)'
              : `Hold still… ${Math.ceil((1 - progress) * 4)}`}
          </button>
          {calError && <p className="text-sm text-alert-ink">{calError}</p>}
        </div>
      )}
    </div>
  );
}
