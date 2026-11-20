import type { Metadata } from 'next';
import SiteHeader from '@/components/site-header';
import Workspace from '@/components/workspace';

export const metadata: Metadata = {
  title: 'Workspace',
  description: 'Live posture and blink tracking, break cues and evening warm shift. Runs entirely in your browser.',
};

export default function AppPage() {
  return (
    <>
      <SiteHeader current="app" />
      <Workspace />
    </>
  );
}
