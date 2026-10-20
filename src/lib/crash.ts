import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

/**
 * Absturzberichte über Sentry – nur wenn ein DSN eingetragen ist und nur in echten Builds.
 * Keine personenbezogenen Daten (sendDefaultPii: false), keine Leistungsmessung.
 */
export function initCrashReporting() {
  if (!DSN || __DEV__ || Platform.OS === 'web') return;
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    enableAutoSessionTracking: false,
  });
}

/** Umhüllt die Root-Komponente, damit auch Abstürze beim Rendern gemeldet werden. */
export const withCrashReporting = Sentry.wrap;
