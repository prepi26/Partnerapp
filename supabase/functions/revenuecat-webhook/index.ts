// RevenueCat meldet hier Verlängerungen, Kündigungen und Abläufe – auch wenn die App geschlossen ist.
// Der Inhalt des Events wird nicht vertraut: der Status wird immer frisch bei RevenueCat abgefragt.
import { json, syncCoupleOf, UUID } from '../_shared/plus.ts';

Deno.serve(async (req) => {
  if (req.headers.get('Authorization') !== `Bearer ${Deno.env.get('REVENUECAT_WEBHOOK_SECRET')}`) {
    return json({ error: 'unauthorized' }, 401);
  }
  const { event } = await req.json();
  const ids = new Set<string>(
    [event?.app_user_id, event?.original_app_user_id, ...(event?.aliases ?? [])].filter(
      (id): id is string => typeof id === 'string' && UUID.test(id),
    ),
  );
  try {
    for (const id of ids) await syncCoupleOf(id);
    return json({ ok: true });
  } catch (e) {
    // 5xx: RevenueCat versucht es später erneut.
    return json({ error: String(e) }, 500);
  }
});
