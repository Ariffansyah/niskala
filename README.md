# Niskala

Techcomfest 2027, Sub-theme 3: Smart Lifestyle & Digital Wellbeing (SDG 3).

A browser workspace (UI in Bahasa Indonesia) that watches posture and blink rate through the webcam, entirely on-device. Posture covers both planes: forward lean and head drop, and sideways lean and head tilt. It responds with a soft edge glow instead of pop-ups, guides 20-second eye breaks and a 60-second desk reset, and warms the screen as bedtime approaches.

In Balinese thought *sekala* is the seen world and *niskala* the unseen. The visual identity follows batik *sogan* dyes: lontar cream, soga brown, nila indigo as the one accent, and kunyit turmeric reserved for strain. The dark theme is *malam*.

## Run

```bash
pnpm install   # also copies the MediaPipe wasm into public/mediapipe
pnpm dev       # http://localhost:3000
pnpm test      # signal math and insights aggregation (node:test, no build step)
```

## Pages

| Route | What it is |
| --- | --- |
| `/` | Landing page with a live slouch demo that drives the real edge glow |
| `/app` | Workspace: first-run setup, tracking, breaks, evening, sensitivity, data |
| `/riwayat` | 7, 14 or 30 days of screen time, leaning share, breaks and late minutes |
| `/privasi` | What is processed, stored, and optionally backed up |

## Workspace features

- **Front or side camera:** a laptop webcam above the screen reads forward lean, sideways lean, head tilt and blinks (MediaPipe Face Landmarker). A camera at the side of the desk reads neck and trunk angles directly (MediaPipe Pose Landmarker), which is more accurate for forward-head posture but cannot see sideways lean or blinks. Each position has its own calibration, and any connected camera can be chosen.
- **Two views of the figure:** side view (*tampak samping*) for forward lean, front view (*tampak depan*, mirrored like the webcam) for sideways lean and head tilt.
- **Three modes:** Camera (posture and blinks), Timer only (no camera, scheduled breaks), and Demo (sliders).
- **Edge glow:** turmeric for sustained leaning or low blinking, indigo when a scheduled break is due. Never a modal.
- **Breaks:** a 20-second eye break (20-20-20 rule) and a 60-second desk reset. Both are timed and step-by-step, with live head-angle and blink feedback from the camera, and can be snoozed for 5 minutes.
- **Mini monitor:** a floating always-on-top window (Document Picture-in-Picture, Chrome and Edge 116+). The camera video and the timers move into it, so tracking keeps its full rate while you work in other apps.
- **Evening:** bedtime-aware warm shift with wind-down and past-bedtime guidance.
- **Sensitivity:** Gentle, Balanced or Strict thresholds. Optional soft chime.
- **Keyboard:** `R` reset, `E` eye break, `M` mini monitor, `Esc` stop.
- **Data:** everything stays in local storage. Download as JSON, delete, or opt in to an anonymous Supabase backup.
- **Installable:** web manifest and icons. Lontar/Malam/Auto theme with no flash on load.

## Architecture

| Module | Role |
| --- | --- |
| `lib/vision.ts` | MediaPipe Face Landmarker per video frame. Its loop follows the video element into the mini monitor window. |
| `lib/signals.ts` | Pure math: baseline, posture on four axes (head, torso, side, tilt), blink counter, strain accumulators, sensitivity presets, bedtime stages |
| `lib/insights.ts` | Per-day aggregation for the Insights page |
| `lib/use-monitor.ts` | 4 Hz loop: drift, strain, glow, break cues, session totals, save and sync |
| `lib/store.ts` | localStorage stores shaped for `useSyncExternalStore`, plus the pre-paint theme script |
| `lib/sync.ts` | Optional Supabase backup (anonymous auth, RLS). The SDK loads only after opt-in. |
| `components/posture-figure.tsx` | 2.5D figure: side view (four layers: hip, shoulder, neck pivots) and front view (three layers: hip and neck roll) |
| `components/ui.tsx`, `ui-client.tsx` | Design-system parts: badge, stat card, meter, progress ring; switch, segmented control, tabs, confirm dialog, toasts |
| `components/icons.tsx` | One-style icon set (24 px grid, 1.75 stroke) |

**Side camera.** The neck angle is the shoulder-to-ear line against vertical (the inverse of the clinical craniovertebral angle) and the trunk angle is the hip-to-shoulder line, both taken from the body side with the most visible landmarks and signed by which way the nose points, so a camera on either side works.

**Sideways lean.** The midpoint between the eye corners is compared with the calibration in eye-widths; the midpoint barely moves when the head turns, so glancing at a second monitor is not read as a lean. Head tilt is the angle of the eye line in the raw frame, ordered by position so it never wraps around ±180°.

**Debouncing.** Drift must pass the sensitivity threshold. Strain builds over 6 to 16 seconds, and the glow stays dark for the first 30%, so a glance at your phone never lights the edge.

**Privacy.** Video frames and landmarks never leave the tab. The model and wasm are served from this origin.

## Supabase (optional)

1. Run `supabase/schema.sql` in the SQL editor.
2. Enable **Authentication → Anonymous sign-ins**.
3. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Set the same variables in Vercel.

Without them the backup option is hidden. On Vercel, `VERCEL_PROJECT_PRODUCTION_URL` sets the canonical URL for metadata, the sitemap and robots.txt. Set `NEXT_PUBLIC_SITE_URL` to override it for a custom domain.

## Figure assets

`assets/figure/figure.blend` holds the scene: a primitive-built figure at a desk with laptop and mug, a three-band toon emission shader with a rim term, inverted-hull outlines in soga brown, an orthographic camera, and `pivot_hip` → `pivot_arms` / `pivot_neck` empties.

Each body group (seat, torso, arms, head) is rendered alone, with the groups in front of it set as holdouts (`assets/figure/render/`). `figure.aseprite` stacks the layers, holds the pivot slices, and exports a 256-colour packed sheet (`public/figure/sheet.png`, 70 KB) plus `lib/figure-sheet.json`. In the browser the arms counter-rotate around the shoulder, so the hands stay on the keyboard as the back rounds.

The front view uses a second orthographic camera (`OrthoFront`) at webcam height with the desk, laptop and mug hidden. Its base, upper and head layers are in `render-front/`, assembled in `figure-front.aseprite`, and exported as `public/figure/front.png` (34 KB) with `lib/figure-front.json`.

## Known limits

- Without the mini monitor, tracking slows to about one frame a second while the tab is hidden, and blink rate is not measured.
- Head pitch is compared to the calibration as an absolute change, so looking up for a long time also counts as drift.
- The warm shift tints Niskala only, not the whole screen.
