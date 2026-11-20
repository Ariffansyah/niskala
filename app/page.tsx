import Link from 'next/link';
import LandingDemo from '@/components/landing-demo';
import { ROUTINES } from '@/lib/routines';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

const SIGNALS = [
  {
    name: 'Forward lean',
    how: 'Your face height, size and tilt, compared with a 4-second upright calibration.',
    answer: 'A turmeric glow at the screen edge, only after the lean has lasted about ten seconds.',
  },
  {
    name: 'Blink rate',
    how: 'Eyelid closures counted per minute. People blink 15 to 20 times a minute, and far less while staring at a screen.',
    answer: 'The same glow when blinking stays under about ten a minute, and a 20-second eye break.',
  },
  {
    name: 'Time at the screen',
    how: 'Minutes this page or its mini monitor is in view. No camera needed.',
    answer: 'A 20-20-20 eye break and the 60-second desk reset on a schedule you set.',
  },
  {
    name: 'Time of night',
    how: 'Your bedtime, set once.',
    answer: 'A warmer tint from two hours before, and plain advice about wrapping up.',
  },
];

const STAYS = [
  'Camera frames, which are analysed in the tab and then dropped',
  'Face landmarks and blink timing',
  'Your upright calibration',
  'Every setting and session total, unless you turn on backup',
];
const CAN_LEAVE = [
  'Rounded session totals: minutes active, minutes leaning, breaks taken, average blink rate',
  'Settings: bedtime, warm shift, break schedule, sensitivity',
  'Sent only after you tick “Back up”, under an anonymous ID',
];

export default function Home() {
  const reset = ROUTINES.reset;
  return (
    <>
      <SiteHeader current="home" />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-x-14 gap-y-10 px-4 pt-6 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:pt-10">
          <div>
            <h1 className="text-4xl leading-[1.08] font-bold sm:text-5xl lg:text-[3.6rem]">
              The strain you stop noticing, kept in view.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted text-pretty">
              Niskala watches how you sit and how often you blink through your webcam, entirely inside the browser. When a
              slouch or a stare lasts, the edge of your screen warms. No pop-ups, no uploads, no account.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/app" className="btn btn-primary min-h-12 px-6 text-base">
                Open the workspace
              </Link>
              <Link href="#how" className="btn min-h-12 px-6 text-base">
                How it works
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted">No camera? Timer mode and a slider demo work without one.</p>
          </div>
          <LandingDemo />
        </section>

        <section id="how" className="border-t border-rule">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
            <h2 className="max-w-2xl text-3xl sm:text-4xl">Four things it notices, and how it answers each.</h2>
            <dl className="mt-12 divide-y divide-rule border-y border-rule">
              {SIGNALS.map((s) => (
                <div key={s.name} className="grid gap-x-10 gap-y-2 py-6 md:grid-cols-[12rem_1fr_1fr]">
                  <dt className="text-lg font-semibold">{s.name}</dt>
                  <dd className="text-muted text-pretty">{s.how}</dd>
                  <dd className="text-pretty">{s.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-surface">
          <div className="mx-auto grid max-w-6xl gap-x-14 gap-y-10 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div>
              <h2 className="text-3xl sm:text-4xl">A minute that undoes an hour.</h2>
              <p className="mt-5 max-w-md text-muted text-pretty">
                The desk reset is timed and guided, step by step. With the camera on it checks that your head really came back
                over your shoulders and counts your blinks while you look away.
              </p>
              <Link href="/app" className="btn mt-8">
                Try the reset
              </Link>
            </div>
            <ol className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2">
              {reset.steps.map((s, i) => (
                <li key={s.title} className="bg-raised p-6">
                  <p className="text-sm text-muted tabular-nums">
                    {String(i + 1).padStart(2, '0')} · {s.seconds} s
                  </p>
                  <h3 className="mt-2 text-lg">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted text-pretty">{s.how}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
          <h2 className="max-w-2xl text-3xl sm:text-4xl">Your camera feed never leaves the tab.</h2>
          <div className="mt-12 grid gap-x-14 gap-y-10 md:grid-cols-2">
            <div>
              <h3 className="text-lg">Stays on your device</h3>
              <ul className="mt-4 space-y-3 text-muted">
                {STAYS.map((x) => (
                  <li key={x} className="border-t border-rule pt-3">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg">Can leave, only if you turn on backup</h3>
              <ul className="mt-4 space-y-3 text-muted">
                {CAN_LEAVE.map((x) => (
                  <li key={x} className="border-t border-rule pt-3">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-10 text-sm text-muted">
            The face model and its runtime are served from this site, so not even a CDN sees you use it.{' '}
            <Link href="/privacy" className="link text-ink">
              Read the privacy notes
            </Link>
            .
          </p>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto grid max-w-6xl gap-x-14 gap-y-8 px-4 py-20 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <h2 className="text-3xl sm:text-4xl">
              <span className="text-muted">Sekala,</span> niskala.
            </h2>
            <div className="space-y-4 text-lg text-pretty">
              <p>
                In Balinese thought, <em>sekala</em> is the world you can see and touch, and <em>niskala</em> the one you
                cannot, which still shapes everything.
              </p>
              <p className="text-muted">
                Screen work has an unseen side too: a back that rounds a degree at a time, eyes that forget to blink, an hour
                that becomes three. Niskala keeps that side quietly in view, then gets out of the way.
              </p>
              <Link href="/app" className="btn btn-primary mt-4">
                Open the workspace
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
