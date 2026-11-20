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

/**
 * Opens the camera into `video` and calls `onSample` once per new video frame
 * (null when no face is found). Resolves to a stop function that releases the
 * camera and the model.
 */
export async function startVision(
  video: HTMLVideoElement,
  onSample: (s: FaceSample | null, t: number) => void,
): Promise<() => void> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
    audio: false,
  });
  const release = () => stream.getTracks().forEach((t) => t.stop());
  let landmarker: FaceLandmarker;
  try {
    video.srcObject = stream;
    await video.play();
    landmarker = await createLandmarker();
  } catch (e) {
    release();
    throw e;
  }

  let raf = 0;
  let lastFrame = -1;
  const loop = () => {
    if (video.readyState >= 2 && video.currentTime !== lastFrame) {
      lastFrame = video.currentTime;
      const t = performance.now();
      onSample(toSample(landmarker.detectForVideo(video, t), video.videoWidth, video.videoHeight), t);
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    landmarker.close();
    release();
    video.srcObject = null;
  };
}
