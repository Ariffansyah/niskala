import type { FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import type { FaceSample } from './signals';

// Both are served from this origin (see the postinstall script), so no frame,
// landmark or even model request ever leaves for a third party.
const WASM_BASE = '/mediapipe';
const MODEL = '/models/face_landmarker.task';

const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
const NOSE_TIP = 1;

async function createLandmarker(): Promise<FaceLandmarker> {
  const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
  const options = (delegate: 'GPU' | 'CPU') => ({
    baseOptions: { modelAssetPath: MODEL, delegate },
    runningMode: 'VIDEO' as const,
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  });
  try {
    return await FaceLandmarker.createFromOptions(fileset, options('GPU'));
  } catch {
    return FaceLandmarker.createFromOptions(fileset, options('CPU'));
  }
}

function toSample(r: FaceLandmarkerResult, w: number, h: number): FaceSample | null {
  const p = r.faceLandmarks[0];
  const m = r.facialTransformationMatrixes[0]?.data;
  const shapes = r.faceBlendshapes[0]?.categories;
  if (!p || !m || !shapes) return null;
  const l = p[LEFT_EYE_OUTER];
  const rt = p[RIGHT_EYE_OUTER];
  const score = (name: string) => shapes.find((c) => c.categoryName === name)?.score ?? 0;
  return {
    pitch: (Math.atan2(m[6], m[10]) * 180) / Math.PI,
    iod: Math.hypot((l.x - rt.x) * w, (l.y - rt.y) * h),
    noseY: p[NOSE_TIP].y * h,
    blink: (score('eyeBlinkLeft') + score('eyeBlinkRight')) / 2,
  };
}

export function describeCameraError(e: unknown) {
  const name = e instanceof DOMException ? e.name : '';
  if (name === 'NotAllowedError') return 'Camera access was blocked. Allow it from the address bar, or use timer mode.';
  if (name === 'NotFoundError') return 'No camera was found on this device. Timer mode still works.';
  if (name === 'NotReadableError') return 'Another app is using the camera. Close it, then start again.';
  return `The vision module could not start: ${e instanceof Error ? e.message : String(e)}`;
}

export type Vision = { video: HTMLVideoElement; stop: () => void };

/**
 * Opens the camera and calls `onSample` once per new video frame (null when no
 * face is found). The returned video element may be moved between documents
 * (e.g. into the mini monitor); the loop follows it.
 */
export async function startVision(onSample: (s: FaceSample | null, t: number) => void): Promise<Vision> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
    audio: false,
  });
  const release = () => stream.getTracks().forEach((t) => t.stop());
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('aria-label', 'Your camera preview, shown only on this screen');
  let landmarker: FaceLandmarker;
  try {
    video.srcObject = stream;
    await video.play();
    landmarker = await createLandmarker();
  } catch (e) {
    release();
    throw e;
  }

  let alive = true;
  let raf = 0;
  let rafWin: Window | null = null;
  let lastRun = 0;
  let lastFrame = -1;
  const loop = () => {
    if (!alive) return;
    lastRun = performance.now();
    if (video.readyState >= 2 && video.currentTime !== lastFrame) {
      lastFrame = video.currentTime;
      onSample(toSample(landmarker.detectForVideo(video, lastRun), video.videoWidth, video.videoHeight), lastRun);
    }
    try {
      rafWin?.cancelAnimationFrame(raf);
    } catch {}
    // Frames are paced by whichever window shows the video, so a visible mini
    // monitor keeps tracking at full rate while this tab is in the background.
    rafWin = video.ownerDocument.defaultView ?? window;
    raf = rafWin.requestAnimationFrame(loop);
  };
  // A frame request queued on a window that just closed never fires, and hidden
  // tabs pause them; this restarts the loop (at about 1 Hz while hidden).
  const watchdog = setInterval(() => performance.now() - lastRun > 1000 && loop(), 1000);
  loop();

  return {
    video,
    stop() {
      alive = false;
      clearInterval(watchdog);
      try {
        rafWin?.cancelAnimationFrame(raf);
      } catch {}
      landmarker.close();
      release();
      video.srcObject = null;
      video.remove();
    },
  };
}
