import { preload } from 'react-dom';
import sheet from '@/lib/figure-sheet.json';
import type { Posture } from '@/lib/signals';

// Rotation limits for the rendered figure, matched to what still reads as a human slouch.
export const TORSO_MAX_DEG = 20;
export const HEAD_MAX_DEG = 26;

const SRC = '/figure/sheet.png';
const { w: SHEET_W, h: SHEET_H } = sheet.meta.size;
const pivot = (name: 'torso' | 'head') => {
  const { bounds: b, pivot: p } = sheet.meta.slices.find((s) => s.name === name)!.keys[0];
  return { x: b.x + p.x, y: b.y + p.y };
};
const HIP = pivot('torso');
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

export default function PostureFigure({ posture }: { posture: Posture | null }) {
  preload(SRC, { as: 'image', fetchPriority: 'high' });
  const torso = (posture?.torso ?? 0) * TORSO_MAX_DEG;
  const head = (posture?.head ?? 0) * HEAD_MAX_DEG;
  return (
    <svg
      viewBox="200 100 560 780"
      className="figure h-full w-full"
      role="img"
      aria-label={`Posture figure: torso ${Math.round(torso)}° and head ${Math.round(head)}° forward of your calibrated upright pose`}
    >
      <line
        x1={HIP.x}
        y1={HIP.y}
        x2={HIP.x}
        y2={150}
        className="stroke-rule"
        strokeWidth={3}
        strokeDasharray="10 10"
      />
      <Layer name="seat" />
      <g className="joint" style={joint(torso, HIP)}>
        <Layer name="torso" />
        <g className="joint" style={joint(head, NECK)}>
          <Layer name="head" />
        </g>
      </g>
    </svg>
  );
}
