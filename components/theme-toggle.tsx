'use client';

import { useSyncExternalStore } from 'react';
import { themeStore, type Theme } from '@/lib/store';
import { IconAuto, IconMoon, IconSun } from './icons';

const OPTIONS: { value: Theme; label: string; icon: typeof IconSun }[] = [
  { value: 'light', label: 'Terang (Lontar)', icon: IconSun },
  { value: 'auto', label: 'Ikut sistem', icon: IconAuto },
  { value: 'dark', label: 'Gelap (Malam)', icon: IconMoon },
];

function apply(next: Theme) {
  themeStore.set(next);
  if (next === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = next;
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.get, themeStore.server);
  return (
    <div role="radiogroup" aria-label="Tema" className="inline-flex rounded-xl bg-surface p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={theme === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => apply(o.value)}
          className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:text-ink aria-checked:bg-raised aria-checked:text-ink aria-checked:shadow-[0_1px_2px_var(--shadow)]"
        >
          <o.icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
