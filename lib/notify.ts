/** True when this browser can show system notifications at all. */
export const canNotify = () => typeof window !== 'undefined' && 'Notification' in window;

/** Asks once; resolves true only if notifications are allowed. */
export async function allowNotifications() {
  if (!canNotify()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

/** A system notification that replaces the previous one; clicking it brings Niskala back. */
export function notify(title: string, body: string) {
  if (!canNotify() || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, { body, icon: '/icon-192.png', tag: 'niskala' });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {}
}
