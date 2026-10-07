// Die App ruft das direkt nach Kauf oder Wiederherstellen auf, damit Plus sofort für beide gilt.
import { admin, json, syncCoupleOf } from '../_shared/plus.ts';

Deno.serve(async (req) => {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json({ error: 'not_authenticated' }, 401);
  try {
    return json({ plus_until: await syncCoupleOf(data.user.id) });
  } catch (e) {
    return json({ error: String(e) }, 502);
  }
});
