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

## 3. Abo „Zwei Zuhause Plus“ – ca. 45 Minuten

Plus gilt **pro Elternteil** (getrennte Eltern teilen kein Abo). Kalender, Kosten, Nachrichten, Entscheidungen,
Übergaben, Vereinbarung und Fachkraft-Zugang bleiben kostenlos – Plus schaltet **PDF-Berichte** und **Belegfotos** frei.

1. **App Store Connect** → App anlegen (Bundle-ID `de.zweizuhause.app`) → *Monetarisierung → Abonnements* →
   Gruppe „Zwei Zuhause Plus“ → zwei Abos, z. B. `plus_monthly` (**4,99 €**) und `plus_yearly` (**39,99 €**,
   7 Tage gratis als Einführungsangebot). Vertrag für kostenpflichtige Apps muss aktiv sein.
2. **RevenueCat** (kostenlos bis 2.500 $ Monatsumsatz): Projekt anlegen → App Store App verbinden
   (In-App-Purchase-Key aus App Store Connect) → *Entitlement* mit Identifier **`plus`** → beide Produkte zuordnen →
   *Offering* „default“ mit beiden Paketen (Monthly, Annual).
3. Öffentlichen RevenueCat-Key (`appl_…`) in `.env` als `EXPO_PUBLIC_REVENUECAT_IOS_KEY` eintragen.
4. Für Android dasselbe mit Google Play (`goog_…`).

> Preisbegründung: OurFamilyWizard kostet 110–200 $/Jahr pro Elternteil, Copario ab 4,99 €/Monat, Wechselplan
> 8,98 €/Monat pro Familie. 39,99 €/Jahr liegt bewusst darunter – Basis gratis ist dein Hebel bei Jugendämtern.

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
