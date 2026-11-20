import type { Metadata } from 'next';
import InsightsView from '@/components/insights-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Insights',
  description: 'Screen time, posture and breaks over the last weeks, from data kept in your browser.',
};

export default function InsightsPage() {
  return (
    <>
      <SiteHeader current="insights" />
      <main className="mx-auto max-w-6xl px-4 pt-4 pb-20 sm:px-8">
        <InsightsView />
      </main>
      <SiteFooter />
    </>
  );
}
