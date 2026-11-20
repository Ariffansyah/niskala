import type { FaceLandmarker, FaceLandmarkerResult, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { profileAngles, type FaceSample, type ProfileSample } from './signals';
import type { CameraView } from './store';

// Everything is served from this origin (see the postinstall script), so no frame,
// landmark or even model request ever leaves for a third party.
const WASM_BASE = '/mediapipe';
const FACE_MODEL = '/models/face_landmarker.task';
const POSE_MODEL = '/models/pose_landmarker_lite.task';

const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
const NOSE_TIP = 1;
// BlazePose indices: nose, then left/right ear, shoulder and hip.
const POSE = { nose: 0, ear: [7, 8], shoulder: [11, 12], hip: [23, 24] } as const;
const MIN_VISIBILITY = 0.5;

export type { CameraView };
export type Sample = ({ view: 'front' } & FaceSample) | ({ view: 'side' } & ProfileSample);

async function fileset() {
  const { FilesetResolver } = await import('@mediapipe/tasks-vision');
  return FilesetResolver.forVisionTasks(WASM_BASE);
}

// GPU is much faster but not available everywhere; fall back to CPU rather than fail.
async function withDelegate<T>(create: (delegate: 'GPU' | 'CPU') => Promise<T>) {
  try {
    return await create('GPU');
  } catch {
    return create('CPU');
  }
}

async function createFace(): Promise<FaceLandmarker> {
  const [{ FaceLandmarker }, files] = await Promise.all([import('@mediapipe/tasks-vision'), fileset()]);
  return withDelegate((delegate) =>
    FaceLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: FACE_MODEL, delegate },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    }),
  );
}

async function createPose(): Promise<PoseLandmarker> {
  const [{ PoseLandmarker }, files] = await Promise.all([import('@mediapipe/tasks-vision'), fileset()]);
  return withDelegate((delegate) =>
    PoseLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: POSE_MODEL, delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
    }),
  );
}

function faceSample(r: FaceLandmarkerResult, w: number, h: number): Sample | null {
  const p = r.faceLandmarks[0];
  const m = r.facialTransformationMatrixes[0]?.data;
  const shapes = r.faceBlendshapes[0]?.categories;
  if (!p || !m || !shapes) return null;
  const l = p[LEFT_EYE_OUTER];
  const rt = p[RIGHT_EYE_OUTER];
  const score = (name: string) => shapes.find((c) => c.categoryName === name)?.score ?? 0;
  // Ordered by position in the frame, so the eye line stays near 0° whichever eye each index names.
  const [a, b] = l.x < rt.x ? [l, rt] : [rt, l];
  return {
    view: 'front',
    pitch: (Math.atan2(m[6], m[10]) * 180) / Math.PI,
    roll: (Math.atan2((b.y - a.y) * h, (b.x - a.x) * w) * 180) / Math.PI,
    iod: Math.hypot((l.x - rt.x) * w, (l.y - rt.y) * h),
    cx: ((l.x + rt.x) / 2) * w,
    noseY: p[NOSE_TIP].y * h,
    blink: (score('eyeBlinkLeft') + score('eyeBlinkRight')) / 2,
  };
}

function poseSample(r: PoseLandmarkerResult, w: number, h: number): Sample | null {
  const p = r.landmarks[0];
  if (!p) return null;
  // Use the body side nearer the camera: its ear, shoulder and hip are the most visible.
  const sideVis = (i: 0 | 1) => Math.min(p[POSE.ear[i]].visibility, p[POSE.shoulder[i]].visibility, p[POSE.hip[i]].visibility);
  const i = sideVis(0) >= sideVis(1) ? 0 : 1;
  if (sideVis(i) < MIN_VISIBILITY) return null;
  const px = (k: number) => ({ x: p[k].x * w, y: p[k].y * h });
  return { view: 'side', ...profileAngles(px(POSE.ear[i]), px(POSE.shoulder[i]), px(POSE.hip[i]), px(POSE.nose)) };
}

export function describeCameraError(e: unknown) {
  const name = e instanceof DOMException ? e.name : '';
  if (name === 'NotAllowedError') return 'Akses kamera diblokir. Izinkan dari bilah alamat, atau pakai mode Timer.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'Kamera tidak ditemukan. Pilih kamera lain, atau pakai mode Timer.';
  if (name === 'NotReadableError') return 'Kamera sedang dipakai aplikasi lain. Tutup aplikasinya, lalu coba lagi.';
  return `Modul penglihatan gagal dimulai: ${e instanceof Error ? e.message : String(e)}`;
}

/** Video inputs; labels are only filled in after camera permission was granted once. */
export async function listCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((d) => d.kind === 'videoinput')
    .map((d, i) => ({ id: d.deviceId, label: d.label || `Kamera ${i + 1}` }));
}

export type Vision = { video: HTMLVideoElement; deviceId: string | null; stop: () => void };

/**
 * Opens the camera and calls `onSample` once per new video frame (null when no
 * face or body is found). The returned video element may be moved between
 * documents (e.g. into the mini monitor); the loop follows it.
 */
export async function startVision(
  onSample: (s: Sample | null, t: number) => void,
  { view, deviceId }: { view: CameraView; deviceId: string | null },
): Promise<Vision> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' }),
    },
    audio: false,
  });
  const release = () => stream.getTracks().forEach((t) => t.stop());
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('aria-label', 'Pratinjau kamera, hanya tampil di layar ini');
  let detect: (t: number) => Sample | null;
  let close: () => void;
  try {
    video.srcObject = stream;
    await video.play();
    if (view === 'front') {
      const face = await createFace();
      detect = (t) => faceSample(face.detectForVideo(video, t), video.videoWidth, video.videoHeight);
      close = () => face.close();
    } else {
      const pose = await createPose();
      detect = (t) => poseSample(pose.detectForVideo(video, t), video.videoWidth, video.videoHeight);
      close = () => pose.close();
    }
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
      onSample(detect(lastRun), lastRun);
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
    deviceId: stream.getVideoTracks()[0]?.getSettings().deviceId ?? null,
    stop() {
      alive = false;
      clearInterval(watchdog);
      try {
        rafWin?.cancelAnimationFrame(raf);
      } catch {}
      close();
      release();
      video.srcObject = null;
      video.remove();
    },
  };
}
