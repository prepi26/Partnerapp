/**
 * Zugangsdaten des Supabase-Projekts (Project Settings → API).
 * Der "anon public" Key ist für Apps gedacht und darf im Code stehen –
 * die Daten schützen die Regeln in supabase/schema.sql.
 * Niemals den "service_role" Key hier eintragen!
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isConfigured = SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;

/** Öffentliche RevenueCat-Keys (appl_… / goog_…) für das Abo „Wir zwei Plus“. */
export const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
export const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

/** Pflicht für Abos im App Store: Links zu Nutzungsbedingungen und Datenschutzerklärung. */
export const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL ?? '';
export const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? '';
