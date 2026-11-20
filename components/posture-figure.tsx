import { preload } from 'react-dom';
import sheet from '@/lib/figure-sheet.json';
import type { Posture } from '@/lib/signals';

// Rotation limits for the rendered figure, matched to what still reads as a human slouch.
export const TORSO_MAX_DEG = 20;
export const HEAD_MAX_DEG = 24;

const SRC = '/figure/sheet.png';
const { w: SHEET_W, h: SHEET_H } = sheet.meta.size;
const pivot = (name: 'torso' | 'arms' | 'head') => {
  const { bounds: b, pivot: p } = sheet.meta.slices.find((s) => s.name === name)!.keys[0];
  return { x: b.x + p.x, y: b.y + p.y };
};
const HIP = pivot('torso');
const SHOULDER = pivot('arms');
const NECK = pivot('head');

function Layer({ name }: { name: keyof typeof sheet.frames }) {
  const { frame: f, spriteSourceSize: s } = sheet.frames[name];
  return (
    <svg x={s.x} y={s.y} width={s.w} height={s.h} viewBox={`${f.x} ${f.y} ${f.w} ${f.h}`}>
      <image href={SRC} width={SHEET_W} height={SHEET_H} />
    </svg>
  );
}

const joint = (deg: number, at: { x: number; y: number }) => ({
  transform: `rotate(${deg}deg)`,
  transformOrigin: `${at.x}px ${at.y}px`,
});

export default function PostureFigure({ posture, className = '' }: { posture: Posture | null; className?: string }) {
  preload(SRC, { as: 'image', fetchPriority: 'high' });
  const torso = (posture?.torso ?? 0) * TORSO_MAX_DEG;
  const head = (posture?.head ?? 0) * HEAD_MAX_DEG;
  return (
    <svg
      viewBox="20 10 1150 1180"
      className={`figure h-full w-full ${className}`}
      role="img"
      aria-label={`Posture figure: torso ${Math.round(torso)}° and head ${Math.round(head)}° forward of the upright pose`}
    >
      <line
        x1={HIP.x}
        y1={HIP.y}
        x2={HIP.x}
        y2={250}
        className="stroke-edge"
        strokeWidth={4}
        strokeDasharray="12 12"
      />
      <Layer name="seat" />
      <g className="joint" style={joint(torso, HIP)}>
        <Layer name="torso" />
        {/* Counter-rotating the arms keeps the hands on the keyboard while the back rounds. */}
        <g className="joint" style={joint(-torso, SHOULDER)}>
          <Layer name="arms" />
        </g>
        <g className="joint" style={joint(head, NECK)}>
          <Layer name="head" />
        </g>
      </g>
    </svg>
  );
}
