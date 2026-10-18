import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

const KEY = 'wirzwei.reviewAskedAt';
const PAUSE_DAYS = 120;

/**
 * Bittet nach einem schönen Moment (Serie ab 3 Tagen, beide haben geantwortet) um eine Bewertung.
 * Höchstens alle 120 Tage – iOS begrenzt die Abfrage zusätzlich selbst auf dreimal im Jahr.
 */
export async function maybeAskForReview(streak: number) {
  if (Platform.OS === 'web' || streak < 3) return;
  try {
    const last = Number(await AsyncStorage.getItem(KEY)) || 0;
    if (Date.now() - last < PAUSE_DAYS * 86_400_000) return;
    if (!(await StoreReview.hasAction())) return;
    await AsyncStorage.setItem(KEY, String(Date.now()));
    await StoreReview.requestReview();
  } catch {
    // Keine Bewertung möglich – kein Problem.
  }
}
