// „Zwei Zuhause Plus“: eine einzige Edge Function für zwei Aufrufer – bewusst ohne Imports aus anderen Dateien,
// damit sie sich im Supabase-Dashboard per Kopieren & Einfügen anlegen lässt.
//
// 1. Die App ruft sie nach Kauf/Wiederherstellen auf (Authorization: Bearer <Nutzer-Token>).
// 2. RevenueCat meldet Verlängerungen/Kündigungen (Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>).
//
// In beiden Fällen wird dem Inhalt nicht vertraut: der Status wird frisch bei RevenueCat abgefragt und
// als families.plus_until gespeichert. Ein Abo gilt für die Familie – es zählt das späteste Ablaufdatum beider Eltern.
//
// Secrets (Dashboard → Edge Functions → Secrets): REVENUECAT_SECRET_KEY, REVENUECAT_WEBHOOK_SECRET.
// „Verify JWT“ ausschalten – die Funktion prüft selbst.
import { createClient } from 'npm:@supabase/supabase-js@2';

const ENTITLEMENT = 'plus';
const FOREVER = '9999-12-31T00:00:00Z';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Ablaufdatum des Plus-Zugangs eines Nutzers laut RevenueCat (null = kein Zugang). */
async function plusExpiry(userId: string): Promise<string | null> {
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${Deno.env.get('REVENUECAT_SECRET_KEY')}` },
  });
  if (!res.ok) throw new Error(`RevenueCat ${res.status}`);
  const body = await res.json();
  const entitlement = body?.subscriber?.entitlements?.[ENTITLEMENT];
  if (!entitlement) return null;
  return entitlement.expires_date ?? FOREVER; // null = lebenslang
}

async function syncFamilyOf(userId: string): Promise<string | null> {
  const { data: family, error } = await admin
    .from('families')
    .select('id, parent_a, parent_b')
    .or(`parent_a.eq.${userId},parent_b.eq.${userId}`)
    .maybeSingle();
  if (error) throw error;
  if (!family) return null;

  const parents = [family.parent_a, family.parent_b].filter((p): p is string => !!p);
  const expiries = (await Promise.all(parents.map(plusExpiry))).filter((d): d is string => !!d);
  const plusUntil = expiries.sort().at(-1) ?? null;

  const { error: updateError } = await admin.from('families').update({ plus_until: plusUntil }).eq('id', family.id);
  if (updateError) throw updateError;
  return plusUntil;
}

Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? '';
  const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');

  // RevenueCat-Webhook
  if (webhookSecret && auth === `Bearer ${webhookSecret}`) {
    const { event } = await req.json().catch(() => ({ event: null }));
    const ids = new Set<string>(
      [event?.app_user_id, event?.original_app_user_id, ...(event?.aliases ?? [])].filter(
        (id): id is string => typeof id === 'string' && UUID.test(id),
      ),
    );
    try {
      for (const id of ids) await syncFamilyOf(id);
      return json({ ok: true });
    } catch (e) {
      return json({ error: String(e) }, 500); // RevenueCat versucht es später erneut
    }
  }

  // Aufruf aus der App
  const { data, error } = await admin.auth.getUser(auth.replace('Bearer ', ''));
  if (error || !data.user) return json({ error: 'not_authenticated' }, 401);
  try {
    return json({ plus_until: await syncFamilyOf(data.user.id) });
  } catch (e) {
    return json({ error: String(e) }, 502);
  }
});
