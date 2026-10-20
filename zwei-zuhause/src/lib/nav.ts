import { router } from 'expo-router';

/** Schließt den aktuellen Bildschirm – auch wenn er direkt geöffnet wurde (z. B. aus einer Mitteilung). */
export function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
