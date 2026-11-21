'use client';

import { useSyncExternalStore } from 'react';

// Document Picture-in-Picture (Chromium 116+) is not in TypeScript's DOM lib yet.
type DocumentPip = { requestWindow(options: { width: number; height: number }): Promise<Window> };
declare global {
  interface Window {
    documentPictureInPicture?: DocumentPip;
  }
}

const SIZE = { width: 320, height: 460 };
const noop = () => () => {};

/** True when the floating window can stay on top of other apps (Chromium); elsewhere it is a normal popup. */
export function usePipSupported() {
  return useSyncExternalStore(noop, () => 'documentPictureInPicture' in window, () => false);
}

/**
 * Opens a small window that shares this page's styles and theme: an always-on-top
 * Picture-in-Picture window where supported, otherwise a popup that can be dragged
 * to a second monitor. Both are same-origin, so React can render into them directly.
 */
export async function openMiniMonitor(): Promise<Window> {
  let w: Window | null;
  if (window.documentPictureInPicture) {
    w = await window.documentPictureInPicture.requestWindow(SIZE);
  } else {
    w = window.open('', 'niskala-mini', `popup,width=${SIZE.width},height=${SIZE.height}`);
    if (!w) throw new Error('Popup diblokir');
    // Reusing an already open popup: start from an empty document.
    w.document.head.replaceChildren();
    w.document.body.replaceChildren();
  }
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
