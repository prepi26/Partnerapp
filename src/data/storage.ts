import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppState, emptyState } from './types';

/**
 * Persistenz-Schnittstelle. Aktuell lokal auf dem Gerät; für echtes Teilen
 * zwischen zwei Handys wird hier später eine Supabase-/Firebase-Variante
 * eingesetzt, ohne dass sich die Screens ändern müssen.
 */
export interface StateStorage {
  load(): Promise<AppState>;
  save(state: AppState): Promise<void>;
  clear(): Promise<void>;
}

const KEY = 'wir-zwei/state/v1';

export const localStorage: StateStorage = {
  async load() {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return emptyState;
    try {
      return { ...emptyState, ...(JSON.parse(raw) as Partial<AppState>) };
    } catch {
      return emptyState;
    }
  },
  async save(state) {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  },
  async clear() {
    await AsyncStorage.removeItem(KEY);
  },
};
