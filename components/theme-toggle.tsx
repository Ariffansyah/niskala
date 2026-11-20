'use client';

import { useSyncExternalStore } from 'react';
import { themeStore, type Theme } from '@/lib/store';

const NEXT: Record<Theme, Theme> = { auto: 'light', light: 'dark', dark: 'auto' };
const LABEL: Record<Theme, string> = { auto: 'Auto', light: 'Lontar', dark: 'Malam' };

export default function ThemeToggle() {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.get, themeStore.server);
  return (
    <button
      type="button"
      className="btn-quiet no-underline"
      aria-label={`Theme: ${LABEL[theme]}${theme === 'auto' ? ' (follows your system)' : ''}. Switch to ${LABEL[NEXT[theme]]}.`}
      onClick={() => {
        const next = NEXT[theme];
        themeStore.set(next);
        if (next === 'auto') delete document.documentElement.dataset.theme;
        else document.documentElement.dataset.theme = next;
      }}
    >
      Theme: {LABEL[theme]}
    </button>
  );
}
