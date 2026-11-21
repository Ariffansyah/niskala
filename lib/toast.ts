type Toast = { id: number; text: string; tone: 'ok' | 'info' };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const NONE: Toast[] = [];

export const toastStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => void listeners.delete(cb);
  },
  get: () => toasts,
  server: () => NONE,
};

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/** Short confirmation at the bottom of the screen; disappears after 3.5 s. */
export function toast(text: string, tone: Toast['tone'] = 'ok') {
  const id = nextId++;
  toasts = [...toasts.slice(-2), { id, text, tone }];
  emit();
  setTimeout(() => dismissToast(id), 3500);
}
