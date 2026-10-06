import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { SUPABASE_ANON_KEY, SUPABASE_URL, isConfigured } from '@/config';

export const supabase = createClient(
  isConfigured ? SUPABASE_URL : 'https://nicht-eingerichtet.supabase.co',
  isConfigured ? SUPABASE_ANON_KEY : 'nicht-eingerichtet',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Token nur im Vordergrund erneuern; auf dem Handy pausiert die App sonst im Hintergrund.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Wirft den Supabase-Fehler als normale Exception, damit Screens ihn anzeigen können. */
export function must<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
