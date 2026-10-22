// „Zwei Zuhause Plus“: eine einzige Edge Function für zwei Aufrufer – bewusst ohne Imports aus anderen Dateien,
// damit sie sich im Supabase-Dashboard per Kopieren & Einfügen anlegen lässt.
//
// 1. Die App ruft sie nach Kauf/Wiederherstellen auf (Authorization: Bearer <Nutzer-Token>, Body { family }).
// 2. RevenueCat meldet Verlängerungen/Kündigungen (Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>).
//
// In beiden Fällen wird dem Inhalt nicht vertraut: der Status wird frisch bei RevenueCat abgefragt. Das Abo des
// Zahlenden gilt für seine Familien – „Plus“ für eine, „Plus Mehrfamilie“ für bis zu drei. Welche Familien es
// abdeckt, entscheidet apply_plus() in der Datenbank (die Familie, für die gekauft wurde, zuerst).
//
// Secrets (Dashboard → Edge Functions → Secrets): REVENUECAT_SECRET_KEY, REVENUECAT_WEBHOOK_SECRET.
// „Verify JWT“ ausschalten – die Funktion prüft selbst.
import { createClient } from 'npm:@supabase/supabase-js@2';

/** Berechtigungen in RevenueCat (Entitlements → Identifier) und wie viele Familien sie abdecken. */
const TIERS = [
  { entitlement: 'plus_multi', families: 3 },
  { entitlement: 'plus', families: 1 },
];
const FOREVER = '9999-12-31T00:00:00Z';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Stärkste laufende Stufe eines Nutzers laut RevenueCat: wie viele Familien, bis wann. */
async function plusOf(userId: string): Promise<{ families: number; until: string | null }> {
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${Deno.env.get('REVENUECAT_SECRET_KEY')}` },
  });
  if (!res.ok) throw new Error(`RevenueCat ${res.status}`);
  const body = await res.json();
  const now = new Date().toISOString();
  for (const tier of TIERS) {
    const e = body?.subscriber?.entitlements?.[tier.entitlement];
    const until = e ? (e.expires_date ?? FOREVER) : null; // null = lebenslang
    if (until && until > now) return { families: tier.families, until };
  }
  return { families: 0, until: null };
}

async function sync(userId: string, family: string | null) {
  const { families, until } = await plusOf(userId);
  const { data, error } = await admin.rpc('apply_plus', {
    p_user: userId,
    p_until: until ?? new Date(0).toISOString(),
    p_capacity: families,
    p_family: family,
  });
  if (error) throw error;
  return { plus_until: until, families_covered: data as number };
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
      for (const id of ids) await sync(id, null);
      return json({ ok: true });
    } catch (e) {
      return json({ error: String(e) }, 500); // RevenueCat versucht es später erneut
    }
  }

  // Aufruf aus der App – mit der Familie, die gerade offen ist.
  const { data, error } = await admin.auth.getUser(auth.replace('Bearer ', ''));
  if (error || !data.user) return json({ error: 'not_authenticated' }, 401);
  const body = await req.json().catch(() => ({}));
  const family = typeof body?.family === 'string' && UUID.test(body.family) ? body.family : null;
  try {
    return json(await sync(data.user.id, family));
  } catch (e) {
    return json({ error: String(e) }, 502);
  }
});
