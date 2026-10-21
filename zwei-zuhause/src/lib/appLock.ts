import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const KEY = 'zweizuhause.appLock';

/** Nach so langer Zeit im Hintergrund wird wieder nach Face ID / Code gefragt. */
export const LOCK_AFTER_MS = 30 * 1000;

export async function loadAppLock(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return (await AsyncStorage.getItem(KEY)) === 'on';
  } catch {
    return false;
  }
}

export async function saveAppLock(on: boolean) {
  try {
    await AsyncStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // Dann bleibt die bisherige Einstellung.
  }
}

/** Hat das Gerät überhaupt eine Sperre (Code, Face ID, Fingerabdruck)? Ohne sie lässt sich nichts schützen. */
export async function lockAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
}

/** Fragt nach Face ID / Fingerabdruck, ersatzweise nach dem Gerätecode. */
export async function unlock(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Zwei Zuhause entsperren',
      cancelLabel: 'Abbrechen',
      fallbackLabel: 'Code eingeben',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
