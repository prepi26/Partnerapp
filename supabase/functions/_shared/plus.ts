// Gemeinsame Logik: Plus-Status eines Paares bei RevenueCat prüfen und in couples.plus_until speichern.
// Läuft nur auf dem Server (Supabase Edge Functions, Deno) mit dem service_role Key.
import { createClient } from 'npm:@supabase/supabase-js@2';

export const ENTITLEMENT = 'plus';
const FOREVER = '9999-12-31T00:00:00Z';

export const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

/** Ablaufdatum des Plus-Zugangs eines Nutzers laut RevenueCat (null = kein Zugang). */
async function plusExpiry(userId: string): Promise<string | null> {
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${Deno.env.get('REVENUECAT_SECRET_KEY')}` },
  });
  if (!res.ok) throw new Error(`RevenueCat ${res.status}`);
  const body = await res.json();
  const entitlement = body?.subscriber?.entitlements?.[ENTITLEMENT];
  if (!entitlement) return null;
  return entitlement.expires_date ?? FOREVER; // null = Lebenslang
}

/** Ein Abo gilt fürs ganze Paar: es zählt das späteste Ablaufdatum beider Partner. */
export async function syncCoupleOf(userId: string): Promise<string | null> {
  const { data: couple, error } = await admin
    .from('couples')
    .select('id, partner_a, partner_b')
    .or(`partner_a.eq.${userId},partner_b.eq.${userId}`)
    .maybeSingle();
  if (error) throw error;
  if (!couple) return null;

  const partners = [couple.partner_a, couple.partner_b].filter((p): p is string => !!p);
  const expiries = (await Promise.all(partners.map(plusExpiry))).filter((d): d is string => !!d);
  const plusUntil = expiries.sort().at(-1) ?? null;

  const { error: updateError } = await admin.from('couples').update({ plus_until: plusUntil }).eq('id', couple.id);
  if (updateError) throw updateError;
  return plusUntil;
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
