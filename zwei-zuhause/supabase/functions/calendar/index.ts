// Kalender-Abo: liefert den Umgangsplan einer Familie als iCalendar (ICS) für iPhone-, Google- und Outlook-Kalender.
// Aufruf: GET /functions/v1/calendar?token=<geheimer Token aus my_calendar_token()>
//
// Kalender-Apps schicken keinen Anmelde-Token – „Verify JWT“ muss aus sein (supabase functions deploy calendar
// --no-verify-jwt). Geschützt ist die Adresse durch den langen Zufalls-Token; die Eltern können ihn jederzeit erneuern.
// Den Inhalt baut die Datenbank (calendar_ics), hier wird nur ausgeliefert. Bewusst ohne Imports aus anderen Dateien.
import { createClient } from 'npm:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const TOKEN = /^[0-9a-f]{64}$/;

/** RFC 5545: Zeilen höchstens 75 Bytes, Fortsetzung beginnt mit einem Leerzeichen. */
function fold(ics: string) {
  const encoder = new TextEncoder();
  return ics
    .split('\r\n')
    .map((line) => {
      const parts: string[] = [];
      let current = '';
      for (const char of line) {
        const limit = parts.length ? 74 : 75;
        if (encoder.encode(current + char).length > limit) {
          parts.push(current);
          current = char;
        } else {
          current += char;
        }
      }
      parts.push(current);
      return parts.join('\r\n ');
    })
    .join('\r\n');
}

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get('token') ?? '';
  if (req.method !== 'GET' || !TOKEN.test(token)) return new Response('Not found', { status: 404 });
  const { data, error } = await admin.rpc('calendar_ics', { p_token: token });
  if (error) return new Response('Error', { status: 500 });
  if (!data) return new Response('Not found', { status: 404 });
  return new Response(fold(data as string), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="zwei-zuhause.ics"',
      'Cache-Control': 'private, max-age=900',
    },
  });
});
