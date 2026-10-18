import AsyncStorage from '@react-native-async-storage/async-storage';

/** Webseite mit den Einladungslinks (GitHub Pages, Repository prepi26.github.io). */
export const INVITE_HOST = 'https://prepi26.github.io';

const KEY = 'wirzwei.pendingInvite';

export function inviteLink(code: string) {
  return `${INVITE_HOST}/j/?c=${code}`;
}

/** Code aus einem geöffneten Einladungslink merken, bis Konto und Onboarding fertig sind. */
export async function savePendingInvite(code: string | undefined) {
  const clean = (code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== 6) return;
  try {
    await AsyncStorage.setItem(KEY, clean);
  } catch {
    // Nicht schlimm – dann wird der Code eben von Hand eingegeben.
  }
}

export async function loadPendingInvite() {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function clearPendingInvite() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // egal
  }
}
