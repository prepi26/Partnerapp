import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { currentLanguage } from '@/i18n';

import { supabase } from './supabase';

// Ist die App offen, kommt alles schon live über Realtime – dann kein zusätzliches Banner.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

let currentToken: string | null = null;
let registration: Promise<void> | null = null;
let registeredLang: string | null = null;

/**
 * Fragt (einmalig) nach der Erlaubnis und meldet dieses Handy für Mitteilungen an.
 * Mehrfache Aufrufe teilen sich denselben Vorgang – wer danach Erinnerungen plant, wartet einfach darauf.
 */
export function registerForPush() {
  // Nach einem Sprachwechsel neu melden – der Server schickt Mitteilungen in dieser Sprache.
  if (!registration || registeredLang !== currentLanguage()) {
    registeredLang = currentLanguage();
    registration = register();
  }
  return registration;
}

async function register() {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.rpc('register_push_token', { p_token: token, p_lang: currentLanguage() });
    if (!error) currentToken = token;
  } catch {
    // Ohne Mitteilungen funktioniert die App trotzdem – beim nächsten Start neu versuchen.
  }
}

/** Beim Abmelden: dieses Handy soll keine Mitteilungen für das alte Konto mehr bekommen. */
export async function unregisterForPush() {
  registration = null;
  if (!currentToken) return;
  try {
    await supabase.rpc('unregister_push_token', { p_token: currentToken });
  } catch {
    // Offline – das Token wird beim nächsten Anmelden einem anderen Konto zugeordnet.
  }
  currentToken = null;
}

/** Wohin eine angetippte Mitteilung führt (vom Server in data.url mitgeschickt). */
export function urlFromResponse(response: Notifications.NotificationResponse | null | undefined) {
  const url = response?.notification.request.content.data?.url;
  return typeof url === 'string' && url.startsWith('/') ? url : null;
}
