import { preload } from 'react-dom';
import frontSheet from '@/lib/figure-front.json';
import sideSheet from '@/lib/figure-sheet.json';
import { UPRIGHT, type Posture } from '@/lib/signals';

// Rotation limits for the rendered figure, matched to what still reads as a human posture.
export const TORSO_MAX_DEG = 20;
export const HEAD_MAX_DEG = 24;
export const SIDE_MAX_DEG = 14;
export const TILT_MAX_DEG = 24;

type Sheet = {
  frames: Record<string, { frame: { x: number; y: number; w: number; h: number }; spriteSourceSize: { x: number; y: number; w: number; h: number } }>;
  meta: { size: { w: number; h: number }; slices: { name: string; keys: { bounds: { x: number; y: number }; pivot: { x: number; y: number } }[] }[] };
};

const pivotOf = (sheet: Sheet, name: string) => {
  const { bounds: b, pivot: p } = sheet.meta.slices.find((s) => s.name === name)!.keys[0];
  return { x: b.x + p.x, y: b.y + p.y };
};

function Layer({ sheet, src, name }: { sheet: Sheet; src: string; name: string }) {
  const { frame: f, spriteSourceSize: s } = sheet.frames[name];
  return (
    <svg x={s.x} y={s.y} width={s.w} height={s.h} viewBox={`${f.x} ${f.y} ${f.w} ${f.h}`}>
      <image href={src} width={sheet.meta.size.w} height={sheet.meta.size.h} />
    </svg>
  );
}

const joint = (deg: number, at: { x: number; y: number }) => ({
  transform: `rotate(${deg}deg)`,
  transformOrigin: `${at.x}px ${at.y}px`,
});

const SIDE_SRC = '/figure/sheet.png';
const SIDE = sideSheet as Sheet;
const HIP = pivotOf(SIDE, 'torso');
const SHOULDER = pivotOf(SIDE, 'arms');
const NECK = pivotOf(SIDE, 'head');

/** Side view: forward lean of the back and head. */
export default function PostureFigure({ posture, className = '' }: { posture: Posture | null; className?: string }) {
  preload(SIDE_SRC, { as: 'image', fetchPriority: 'high' });
  const p = posture ?? UPRIGHT;
  const torso = p.torso * TORSO_MAX_DEG;
  const head = p.head * HEAD_MAX_DEG;
  return (
    <svg
      viewBox="20 10 1150 1180"
      className={`figure h-full w-full ${className}`}
      role="img"
      aria-label={`Tampak samping: punggung condong ${Math.round(torso)}° dan kepala ${Math.round(head)}° ke depan`}
    >
      <Layer sheet={SIDE} src={SIDE_SRC} name="seat" />
      <g className="joint" style={joint(torso, HIP)}>
        <Layer sheet={SIDE} src={SIDE_SRC} name="torso" />
        {/* Counter-rotating the arms keeps the hands on the keyboard while the back rounds. */}
        <g className="joint" style={joint(-torso, SHOULDER)}>
          <Layer sheet={SIDE} src={SIDE_SRC} name="arms" />
        </g>
        <g className="joint" style={joint(head, NECK)}>
          <Layer sheet={SIDE} src={SIDE_SRC} name="head" />
        </g>
      </g>
    </svg>
  );
}

const FRONT_SRC = '/figure/front.png';
const FRONT = frontSheet as Sheet;
const F_HIP = pivotOf(FRONT, 'upper');
const F_NECK = pivotOf(FRONT, 'head');

/** Front view, as the webcam sees you but mirrored: sideways lean and head tilt. */
export function FrontFigure({ posture, className = '' }: { posture: Posture | null; className?: string }) {
  const p = posture ?? UPRIGHT;
  const side = p.side * SIDE_MAX_DEG;
  const tilt = p.tilt * TILT_MAX_DEG;
  return (
    <svg
      viewBox="120 40 560 760"
      className={`figure h-full w-full ${className}`}
      role="img"
      aria-label={`Tampak depan: badan miring ${Math.abs(Math.round(side))}° dan kepala miring ${Math.abs(Math.round(tilt))}°`}
    >
      <Layer sheet={FRONT} src={FRONT_SRC} name="base" />
      <g className="joint" style={joint(side, F_HIP)}>
        <Layer sheet={FRONT} src={FRONT_SRC} name="upper" />
        {/* Tilt is measured against the room, so subtract the body's lean before nesting the head. */}
        <g className="joint" style={joint(tilt - side, F_NECK)}>
          <Layer sheet={FRONT} src={FRONT_SRC} name="head" />
        </g>
      </g>
    </svg>
  );
}
