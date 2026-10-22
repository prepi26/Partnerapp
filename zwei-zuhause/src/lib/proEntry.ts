import { Platform } from 'react-native';

const KEY = 'zz.pro-entry';

/**
 * Im Browser über …/?fachkraft geöffnet (Link für Jugendamt und Beratung): Einführung für Eltern überspringen und
 * gleich „Ich bin Fachkraft“ zeigen. Gilt für diesen Browser-Tab.
 */
export function isProEntry(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  try {
    if (new URLSearchParams(window.location.search).has('fachkraft')) window.sessionStorage.setItem(KEY, '1');
    return window.sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
