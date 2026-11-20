import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What Niskala processes, what it stores, and what can leave your device.',
};

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-x-10 gap-y-3 border-t border-rule py-8 md:grid-cols-[14rem_1fr]">
      <h2 className="text-lg">{title}</h2>
      <div className="space-y-3 text-pretty text-muted [&_strong]:font-semibold [&_strong]:text-ink">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader current="privacy" />
      <main className="mx-auto max-w-4xl px-4 pt-4 pb-20 sm:px-8">
        <h1 className="text-3xl sm:text-4xl">Privacy</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted text-pretty">
          Niskala was built so that the camera can help without anyone else seeing through it. This page lists exactly what
          happens to your data.
        </p>
        <div className="mt-10">
          <Block title="The camera">
            <p>
              The camera only starts when you press <strong>Start camera</strong>, and stops when you press Stop, switch modes or
              close the tab. Each frame is analysed by a face model running in your browser and then discarded.{' '}
              <strong>No image, video or face landmark is uploaded or saved.</strong>
            </p>
            <p>
              The model and its runtime are served from this website, so no third-party server is contacted when tracking runs.
            </p>
          </Block>
          <Block title="What is kept in memory">
            <p>
              While tracking runs, Niskala keeps a few numbers per frame: head angle, the distance between your eyes in the
              picture, how high your face sits, and whether your eyes are closed. They are used for the live readouts and are
              gone when you leave the page.
            </p>
          </Block>
          <Block title="What is saved in your browser">
            <p>
              Stored in this browser&apos;s local storage: your <strong>settings</strong>, your <strong>calibration</strong> (three
              numbers describing your upright pose) and <strong>session totals</strong> such as minutes active, minutes leaning,
              breaks taken and average blink rate. They power the Insights page.
            </p>
            <p>
              You can download all of it as a file, or delete it, from the <Link href="/app" className="link text-ink">workspace</Link>{' '}
              under Your data.
            </p>
          </Block>
          <Block title="Optional backup">
            <p>
              If a backup service is configured for this site, the workspace shows a <strong>Back up</strong> checkbox. It is off by
              default. When you turn it on, session totals and settings (bedtime, warm shift, break schedule, sensitivity) are sent
              to a Supabase database under an anonymous ID, with rules that let only that ID read its rows. Your calibration is
              never sent.
            </p>
          </Block>
          <Block title="No tracking of you">
            <p>There are no analytics, advertising scripts, cookies or accounts on this site.</p>
          </Block>
          <Block title="Not medical advice">
            <p>
              Niskala gives general ergonomic and sleep-hygiene prompts. It is not a medical device. If you have ongoing neck,
              back or eye pain, see a health professional.
            </p>
          </Block>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
