'use client';

import { useSyncExternalStore } from 'react';

// Document Picture-in-Picture (Chromium 116+) is not in TypeScript's DOM lib yet.
type DocumentPip = { requestWindow(options: { width: number; height: number }): Promise<Window> };
declare global {
  interface Window {
    documentPictureInPicture?: DocumentPip;
  }
}

const noop = () => () => {};
/** False during prerender and in browsers without Document Picture-in-Picture. */
export function usePipSupported() {
  return useSyncExternalStore(noop, () => 'documentPictureInPicture' in window, () => false);
}

/** Opens an always-on-top window that shares this page's styles and theme. */
export async function openMiniMonitor(): Promise<Window> {
  const w = await window.documentPictureInPicture!.requestWindow({ width: 300, height: 420 });
  // The new window starts at about:blank; a base URL lets the copied stylesheet and figure paths resolve.
  const base = w.document.createElement('base');
  base.href = location.href;
  w.document.head.append(base);
  document.head
    .querySelectorAll('link[rel="stylesheet"], style')
    .forEach((n) => w.document.head.append(n.cloneNode(true)));
  const root = document.documentElement;
  w.document.documentElement.className = root.className;
  if (root.dataset.theme) w.document.documentElement.dataset.theme = root.dataset.theme;
  w.document.title = 'Niskala';
  w.document.body.className = 'min-h-dvh bg-paper font-sans text-ink';
  return w;
}
