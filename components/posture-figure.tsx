import { preload } from 'react-dom';
import ayuFront from '@/lib/figure-ayu-front.json';
import ayuSide from '@/lib/figure-ayu.json';
import bimaFront from '@/lib/figure-bima-front.json';
import bimaSide from '@/lib/figure-bima.json';
import rakaFront from '@/lib/figure-front.json';
import rakaSide from '@/lib/figure-sheet.json';
import sekarFront from '@/lib/figure-sekar-front.json';
import sekarSide from '@/lib/figure-sekar.json';
import { UPRIGHT, type Posture } from '@/lib/signals';
import type { FigureId } from '@/lib/store';

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

/** Everyone shares one rig in figure.blend, so only hair, clothes and skin differ between sheets. */
// hue matches the dye of each figure's top, for rings and tints around them.
export const FIGURES: { id: FigureId; name: string; hue: string; side: Sheet; front: Sheet }[] = [
  { id: 'raka', name: 'Raka', hue: 'hue-nila', side: rakaSide, front: rakaFront },
  { id: 'ayu', name: 'Ayu', hue: 'hue-daun', side: ayuSide, front: ayuFront },
  { id: 'sekar', name: 'Sekar', hue: 'hue-mengkudu', side: sekarSide, front: sekarFront },
  { id: 'bima', name: 'Bima', hue: 'hue-ungu', side: bimaSide, front: bimaFront },
];
export const byId = (id: FigureId) => FIGURES.find((f) => f.id === id) ?? FIGURES[0];
const sideSrc = (id: FigureId) => (id === 'raka' ? '/figure/sheet.png' : `/figure/${id}.png`);
const frontSrc = (id: FigureId) => (id === 'raka' ? '/figure/front.png' : `/figure/${id}-front.png`);

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

/** Side view: forward lean of the back and head. */
export default function PostureFigure({ posture, who = 'raka', className = '' }: { posture: Posture | null; who?: FigureId; className?: string }) {
  const sheet = byId(who).side;
  const src = sideSrc(who);
  preload(src, { as: 'image', fetchPriority: 'high' });
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
      <Layer sheet={sheet} src={src} name="seat" />
      <g className="joint" style={joint(torso, pivotOf(sheet, 'torso'))}>
        <Layer sheet={sheet} src={src} name="torso" />
        {/* Counter-rotating the arms keeps the hands on the keyboard while the back rounds. */}
        <g className="joint" style={joint(-torso, pivotOf(sheet, 'arms'))}>
          <Layer sheet={sheet} src={src} name="arms" />
        </g>
        <g className="joint" style={joint(head, pivotOf(sheet, 'head'))}>
          <Layer sheet={sheet} src={src} name="head" />
        </g>
      </g>
    </svg>
  );
}

/** Front view, as the webcam sees you but mirrored: sideways lean and head tilt. */
export function FrontFigure({ posture, who = 'raka', className = '' }: { posture: Posture | null; who?: FigureId; className?: string }) {
  const sheet = byId(who).front;
  const src = frontSrc(who);
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
      <Layer sheet={sheet} src={src} name="base" />
      <g className="joint" style={joint(side, pivotOf(sheet, 'upper'))}>
        <Layer sheet={sheet} src={src} name="upper" />
        {/* Tilt is measured against the room, so subtract the body's lean before nesting the head. */}
        <g className="joint" style={joint(tilt - side, pivotOf(sheet, 'head'))}>
          <Layer sheet={sheet} src={src} name="head" />
        </g>
      </g>
    </svg>
  );
}

/** Head and shoulders from the front sheet, for avatars. */
export function FigureFace({ who }: { who: FigureId }) {
  const sheet = byId(who).front;
  const src = frontSrc(who);
  return (
    <svg viewBox="290 60 220 220" className="h-full w-full" aria-hidden>
      <Layer sheet={sheet} src={src} name="upper" />
      <Layer sheet={sheet} src={src} name="head" />
    </svg>
  );
}

/** Native radios, so arrow keys move between figures. Render inside a client component. */
export function FigurePicker({ value, onChange, size = 'size-11' }: { value: FigureId; onChange: (id: FigureId) => void; size?: string }) {
  return (
    <div role="radiogroup" aria-label="Figur" className="flex gap-2">
      {FIGURES.map((f) => (
        <label
          key={f.id}
          title={f.name}
          className={`${f.hue} ${size} relative cursor-pointer overflow-hidden rounded-full bg-hue-soft ring-2 ring-transparent ring-offset-2 ring-offset-raised transition-shadow hover:ring-hue/40 has-checked:ring-hue has-focus-visible:outline-2 has-focus-visible:outline-accent`}
        >
          <input type="radio" name="figure" className="sr-only" checked={value === f.id} onChange={() => onChange(f.id)} aria-label={f.name} />
          <FigureFace who={f.id} />
        </label>
      ))}
    </div>
  );
}
