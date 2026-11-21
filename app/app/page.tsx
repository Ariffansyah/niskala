import type { Metadata } from 'next';
import Workspace from '@/components/workspace';

export const metadata: Metadata = {
  title: 'Ruang Kerja',
  description: 'Pelacakan postur dan kedipan langsung, pengingat jeda, dan layar hangat menjelang tidur. Berjalan sepenuhnya di browser.',
};

export default function AppPage() {
  return <Workspace />;
}
