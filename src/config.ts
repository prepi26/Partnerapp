/**
 * Zugangsdaten des Supabase-Projekts (Project Settings → API).
 * Der "anon public" Key ist für Apps gedacht und darf im Code stehen –
 * die Daten schützen die Regeln in supabase/schema.sql.
 * Niemals den "service_role" Key hier eintragen!
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isConfigured = SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;
