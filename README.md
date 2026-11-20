# Niskala

Techcomfest 2027, Sub-theme 3: Smart Lifestyle & Digital Wellbeing (SDG 3).

A browser workspace that watches posture and blink rate through the webcam, entirely on-device. It responds with a soft edge glow instead of pop-ups, offers a guided 60-second desk reset, and warms the screen as bedtime approaches.

## Run

```bash
pnpm install   # also copies the MediaPipe wasm into public/mediapipe
pnpm dev       # http://localhost:3000
pnpm test      # signal math (node:test, no build step)
```

The page opens in **Simulation** mode, so it works with no camera, in bad lighting, or for judges. Sliders drive the same pipeline the camera does.

## How it works

| Module | Role |
| --- | --- |
| `lib/vision.ts` | MediaPipe Face Landmarker on each video frame. Emits head pitch, eye distance, nose height and blink score. Loaded on demand. |
| `lib/signals.ts` | Pure math: calibration baseline, posture drift, blink counter, strain accumulators, bedtime stages. Tested in `signals.test.ts`. |
| `lib/use-monitor.ts` | 4 Hz loop that turns camera or simulation input into strain, glow level and session totals. |
| `lib/store.ts` | localStorage: preferences, baseline, session summaries. |
| `lib/sync.ts` | Optional Supabase backup (anonymous auth, RLS). The SDK loads only after opt-in. |
| `components/posture-figure.tsx` | 2.5D figure: three cel-shaded layers rotated around the hip and neck pivots. |

**Debouncing.** Drift must exceed 35% of the range. Strain builds over about 10 s, and the glow stays dark for the first 30%, so a glance at your phone never lights the edge.

**Privacy.** Video frames and landmarks never leave the tab. The model and wasm are served from this origin, so not even a CDN sees the page. Only rounded session totals and preferences can sync, and only after the user ticks the box.

## Supabase (optional)

1. Run `supabase/schema.sql` in the SQL editor.
2. Enable **Authentication → Anonymous sign-ins**.
3. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Set the same variables in Vercel.

Without these variables the backup option is hidden and everything stays local.

## Figure assets

`assets/figure/figure.blend` holds the scene: primitive figurine, toon emission shader with a rim term, inverted-hull outlines, orthographic camera, and `pivot_hip` / `pivot_neck` empties. Each body group is rendered alone, with the groups in front of it set as holdouts (`assets/figure/render/`). `figure.aseprite` stacks the layers, with pivot slices, and exports `public/figure/sheet.png` plus `lib/figure-sheet.json`, which the component reads for frame rects and pivots.

## Known limits

- Tracking and the glow only run while this tab is visible. Browsers pause frame callbacks in background tabs.
- Head pitch is compared to the calibration as an absolute change, so looking up for a long time also counts as drift.
- The warm shift tints this tab only.
