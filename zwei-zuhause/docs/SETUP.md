# Zwei Zuhause einrichten und veröffentlichen

Alles, was nur du anlegen kannst – in der Reihenfolge, in der es nötig ist. Rechne mit 2–3 Abenden plus Prüfzeit bei Apple.

## 1. Server (Supabase) – ca. 20 Minuten

1. supabase.com → **New project**. Name `zwei-zuhause`, Passwort generieren, Region **Frankfurt (eu-central-1)**.
   *Eigenes Projekt – nicht das von „Wir zwei“.*
2. **SQL Editor** → *New query* → kompletten Inhalt von `supabase/schema.sql` einfügen → **Run** → „Success“.
   Erneutes Ausführen schadet nicht (nach jedem Update der Datei einfach nochmal).
3. **Authentication → Sign In / Providers → Email**:
   - *Confirm email* **aus** (die App meldet mit E-Mail + Passwort an, kein Mailversand nötig)
   - *Minimum password length* **8**
4. **Authentication → Emails → Reset password**: Vorlage so ändern, dass der Code drinsteht (die App fragt nach einem
   Code, nicht nach einem Link), z. B. `Dein Code: {{ .Token }}`.
5. **Project Settings → API**: *Project URL* und *anon/publishable key* kopieren → in `zwei-zuhause/.env`
   (Vorlage: `.env.example`). Niemals den `service_role`-Key.
6. **Database → Extensions**: prüfen, dass `pg_net` aktiv ist (für Push-Mitteilungen; das Schema schaltet es ein).
7. **Auftragsverarbeitungsvertrag (DPA)** bei Supabase abschließen: *Organization → Legal Documents*. Pflicht nach DSGVO.

## 2. Expo / EAS – ca. 15 Minuten

```bash
cd zwei-zuhause
npm install
npx eas-cli@latest login
npx eas-cli@latest init          # legt die projectId in app.json an – nötig für Push-Mitteilungen
```

Danach testen: `npx expo start` und mit der Kamera den QR-Code scannen.

**Android-Push:** braucht zusätzlich ein Firebase-Projekt (`google-services.json`) und den FCM-Schlüssel in EAS
(`npx eas-cli@latest credentials`). iOS-Push richtet EAS beim ersten Build automatisch ein.
**Achtung:** Push, Käufe und Kamera laufen nur in einem *Development Build*, nicht in Expo Go:
`npx eas-cli@latest build --profile development --platform ios`.

## 3. Abo „Zwei Zuhause Plus“ – ca. 60 Minuten

**Modell:** Ein Abo für die **ganze Familie** – einer zahlt, beide Eltern nutzen alles. Wer Kinder mit verschiedenen
Eltern hat, legt mehrere Familien an (streng getrennt); jede Familie braucht ihr Abo – oder der Elternteil nimmt
„Plus Mehrfamilie“ für bis zu 3 eigene Familien. Welche Familien ein Abo abdeckt, legt `apply_plus()` fest. **14 Tage kostenlos** ab dem
Beitritt des zweiten Elternteils; wer allein startet, kann die App bis zu 30 Tage kostenlos nutzen. Danach ohne Abo
**nur noch lesen** (Lesen, Export, eigene Einträge löschen und Konto löschen
gehen immer – DSGVO). Die Sperre setzt die Datenbank durch (`family_active()` in `schema.sql`), nicht nur die App.
Fachkräfte zahlen nie.

1. **App Store Connect** → App anlegen (Bundle-ID `de.zweizuhause.app`) → *Monetarisierung → Abonnements* →
   Gruppe „Zwei Zuhause Plus“ → vier Abos in **derselben** Gruppe (dann ist der Wechsel ein Upgrade):
   `plus_monthly` (**7,99 €**), `plus_yearly` (**59,99 €**) – für 1 Familie – und `plus_multi_monthly` (**11,99 €**),
   `plus_multi_yearly` (**89,99 €**) – „Plus Mehrfamilie“ für bis zu 3 Familien (Kinder mit verschiedenen Eltern).
   Die App erkennt Mehrfamilie am Wort `multi` im Namen.
   **Kein** Einführungsangebot einstellen – die 14 Tage laufen bereits in der App. Vertrag für kostenpflichtige Apps
   muss aktiv sein.
2. **RevenueCat** (kostenlos bis 2.500 $ Monatsumsatz): Projekt anlegen → App Store App verbinden
   (In-App-Purchase-Key aus App Store Connect) → *Entitlement* **`plus`** (die beiden 1-Familien-Produkte) und
   *Entitlement* **`plus_multi`** (die beiden Mehrfamilie-Produkte) → *Offering* „default“ mit vier Paketen: Monthly,
   Annual und zwei eigene Pakete `multi_monthly`, `multi_annual`.
3. Öffentlichen RevenueCat-Key (`appl_…`) in `.env` als `EXPO_PUBLIC_REVENUECAT_IOS_KEY` eintragen.
4. **Edge Function anlegen** (damit ein Kauf für beide Eltern gilt): Supabase → *Edge Functions* → *Deploy a new
   function* → Name `plus` → Inhalt von `supabase/functions/plus/index.ts` einfügen → **Verify JWT aus**.
   Unter *Secrets*: `REVENUECAT_SECRET_KEY` (RevenueCat → API Keys → Secret) und `REVENUECAT_WEBHOOK_SECRET`
   (beliebiges langes Passwort).
5. **RevenueCat-Webhook** (Verlängerungen/Kündigungen): RevenueCat → *Integrations → Webhooks* → URL
   `https://<projekt>.supabase.co/functions/v1/plus`, Authorization-Header `Bearer <REVENUECAT_WEBHOOK_SECRET>`.
6. Für Android dasselbe mit Google Play (`goog_…`).
7. **Kalender-Abo** (Umgangsplan im iPhone-/Google-Kalender): zweite Edge Function `calendar` mit dem Inhalt von
   `supabase/functions/calendar/index.ts` anlegen → **Verify JWT aus** (Kalender-Apps können sich nicht anmelden;
   geschützt ist die Adresse durch einen langen Zufalls-Token). Per CLI: `supabase functions deploy calendar
   --no-verify-jwt`. Keine Secrets nötig.

> **Preis:** 7,99 €/Monat bzw. 59,99 €/Jahr pro Familie. Zum Vergleich: OurFamilyWizard 110–200 $/Jahr **pro
> Elternteil**, Wechselplan 89,98 €/Jahr pro Familie, Copario ab 4,99 €/Monat.

> **Apple-Prüfung – Risiko [wahrscheinlich gering, aber ehrlich gesagt nicht sicher]:** Eine Testzeit, die die App
> selbst verwaltet, ist bei Abo-Apps verbreitet („14 Tage voller Funktionsumfang, danach nur lesen“). Apple achtet
> darauf, dass vor dem Kauf klar steht, was nach der Testzeit passiert – das zeigt die Abo-Seite. Lehnt Apple ab,
> ist die Alternative ein 14-tägiges **Einführungsangebot** direkt am Abo in App Store Connect.

8. **Gutscheincodes** für Jugendämter und Beratungsstellen (z. B. 90 Tage kostenlos nach der Testzeit) legst nur du an –
   im SQL Editor:
   ```sql
   insert into public.promo_codes (code, label, days) values ('JA-AACHEN', 'Jugendamt Aachen', 90);
   -- optional begrenzt: max_uses (Anzahl Familien) und valid_until (Datum)
   select * from public.promo_stats;  -- wie oft welcher Code eingelöst wurde
   ```
   Jede Familie kann einen Code einlösen (Mehr → Abo & Gutschein). Codes kann aus der App niemand auflisten.

### Browser-Zugang für Fachkräfte

Viele Jugendämter dürfen auf Dienstgeräten keine Apps installieren. Dieselbe App läuft im Browser:

```bash
npx expo export --platform web        # baut nach dist/ – mit den EXPO_PUBLIC_…-Werten aus .env
npx eas-cli@latest deploy --prod      # veröffentlicht auf EAS Hosting, Adresse z. B. https://zwei-zuhause.expo.app
```

Den Fachkräften diesen Link geben: **`https://<deine-adresse>/?fachkraft`** – dann entfällt die Einführung für Eltern,
die Anmeldung erklärt den Fachkraft-Zugang, und nach 30 Minuten ohne Aktivität meldet der Browser automatisch ab
(geteilte Dienst-PCs). Eltern können den Browser auch nutzen, Push-Mitteilungen, App-Sperre und Erinnerungen gibt es dort
aber nicht. *(Befehle aus `eas-cli` 25.3 gelesen; die Expo-Doku war beim Schreiben nicht erreichbar – beim ersten
Mal kurz gegen https://docs.expo.dev/eas/hosting/get-started/ prüfen.)*

## 4. Pflichtseiten veröffentlichen

Entwürfe liegen in `docs/` – **von einer Fachanwältin/einem Datenschutzberater prüfen lassen**, bevor es live geht.

- `docs/DATENSCHUTZ.md` → als Webseite veröffentlichen (z. B. GitHub Pages wie bei „Wir zwei“) → URL in `.env` als
  `EXPO_PUBLIC_PRIVACY_URL`
- `docs/NUTZUNGSBEDINGUNGEN.md` (inkl. Impressum) → URL als `EXPO_PUBLIC_TERMS_URL`
- Datenschutz-Folgenabschätzung (DSFA): sehr wahrscheinlich Pflicht (Kinderdaten, Konfliktdaten, ggf. Gesundheit).
  Vorlage: Kurzpapier Nr. 5 der Datenschutzkonferenz. Ist auch dein bestes Argument beim Jugendamt.

## 5. In den App Store

```bash
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios
```

In App Store Connect:
- Texte aus `docs/STORE.md`, Screenshots (6,7" und 6,5"), Datenschutz-URL, Altersfreigabe 4+
- **App-Datenschutz**: E-Mail (Konto), Nutzerinhalte (Nachrichten, Fotos), Gesundheit (nur falls Kind-Infos genutzt),
  Kennungen (Push-Token) – alles „mit Identität verknüpft“, **kein Tracking**
- **Prüfer-Zugang**: In Supabase *Authentication → Users → Add user* zwei Konten anlegen (Auto Confirm), mit dem
  ersten eine Familie anlegen, mit dem zweiten beitreten, ein paar Einträge machen. Beide Zugangsdaten unter
  *App Review Information* eintragen und erklären: „Zwei Konten, weil die App zwei Elternteile verbindet.“

## 6. Vor dem Start testen (mit 2 Handys!)

Checkliste in `docs/TESTPLAN.md`. Ein lokaler Ende-zu-Ende-Test ohne Handy: `e2e/local-stack.sh` (Docker) und
`node e2e/flow-basics.js` / `node e2e/flow-features.js` (Playwright).
