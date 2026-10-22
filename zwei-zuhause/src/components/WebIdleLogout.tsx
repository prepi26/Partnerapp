import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useStore } from '@/data/store';

/** Nach so langer Untätigkeit wird eine Fachkraft im Browser abgemeldet (Dienst-PCs werden geteilt). */
const IDLE_MS = 30 * 60 * 1000;

export function WebIdleLogout() {
  const { signOut } = useStore();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    let last = Date.now();
    const touch = () => {
      last = Date.now();
    };
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    for (const e of events) window.addEventListener(e, touch, { passive: true });
    const timer = setInterval(() => {
      if (Date.now() - last > IDLE_MS) signOut().catch(() => {});
    }, 60 * 1000);
    return () => {
      clearInterval(timer);
      for (const e of events) window.removeEventListener(e, touch);
    };
  }, [signOut]);

  return null;
}
