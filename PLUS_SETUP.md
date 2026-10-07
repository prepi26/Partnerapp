# Geld verdienen: „Wir zwei Plus“ einrichten

Wir zwei finanziert sich über ein **Abo für beide Partner** (einer zahlt, beide haben Plus). Keine Werbung.

| Kostenlos | Plus |
| --- | --- |
| Alles wie bisher | Unbegrenzte Momente (kostenlos: 10, serverseitig erzwungen) |
| Frage des Tages | + 3 Themen-Fragen täglich: Tiefgang 🌊, Zukunft 🏡, Prickelnd 🌶️ |

Vorschlag für Preise (stellst du im App Store / Google Play ein, nicht im Code):
**4,99 €/Monat**, **29,99 €/Jahr mit 7 Tagen gratis**, optional **59,99 € einmalig**.

## Ablauf

App kauft über RevenueCat → ruft die Edge Function `plus-sync` auf → die prüft den Kauf direkt bei RevenueCat und setzt
`couples.plus_until` → beide Handys sehen Plus sofort (Live-Update). Verlängerungen und Abläufe meldet RevenueCat an
`revenuecat-webhook`. Nutzer können `plus_until` selbst nicht ändern.

## Schritte

1. **Datenbank**: `supabase/schema.sql` erneut komplett im SQL Editor ausführen (fügt `plus_until`, Limit und
   `pack_answers` hinzu).
2. **Stores**: Apple Developer Account (99 $/Jahr) und Google Play Console (25 $ einmalig). Dort je ein
   Abo-Produkt anlegen (monatlich, jährlich), plus Bank- und Steuerdaten (sonst kein Geld).
3. **RevenueCat** (kostenlos bis 2.500 $ Monatsumsatz): Projekt anlegen, iOS- und Android-App verbinden, Produkte
   importieren. *Entitlement* mit Identifier **`plus`** anlegen und alle Produkte zuordnen. *Offering* „default“
   als *current* markieren mit Paketen *Monthly*, *Annual* (und optional *Lifetime*).
4. **Keys in `.env`**: öffentliche App-Keys als `EXPO_PUBLIC_REVENUECAT_IOS_KEY` (`appl_…`) und
   `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (`goog_…`). Außerdem `EXPO_PUBLIC_TERMS_URL` und `EXPO_PUBLIC_PRIVACY_URL`
   (Apple lehnt Abos ohne diese Links ab).
5. **Edge Functions** (Supabase CLI):

   ```bash
   bunx supabase login
   bunx supabase link --project-ref <projekt-ref>
   bunx supabase secrets set REVENUECAT_SECRET_KEY=sk_... REVENUECAT_WEBHOOK_SECRET=<langes-zufallspasswort>
   bunx supabase functions deploy plus-sync
   bunx supabase functions deploy revenuecat-webhook --no-verify-jwt
   ```

   `REVENUECAT_SECRET_KEY` ist der **geheime** V1-Key aus RevenueCat – nie in `.env` oder die App.
6. **Webhook**: RevenueCat → *Integrations* → *Webhooks* → URL
   `https://<projekt-ref>.supabase.co/functions/v1/revenuecat-webhook`, Authorization-Header
   `Bearer <REVENUECAT_WEBHOOK_SECRET>`.
7. **Limit einschalten**: im SQL Editor `update public.app_settings set plus_enabled = true;` ausführen. Vorher gilt
   kein 10-Momente-Limit (Version 1 ohne Abo).
8. **Neuer Build nötig**: Käufe brauchen nativen Code, ein `eas update` reicht nicht.
   `npx eas-cli@latest build --profile production`, danach `eas submit`. In Expo Go läuft RevenueCat nur im
   Vorschaumodus (keine echten Käufe).
