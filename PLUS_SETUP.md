# „Wir zwei Plus“ einrichten (In-App-Abo)

Ein Abo gilt für **beide Partner** – einer zahlt, beide haben Plus. Keine Werbung.

| Kostenlos | Plus |
| --- | --- |
| Zähler, Herzen, Zettel, Frage des Tages, Quiz, Erfolge, Widget, Jahresrückblick | **Zeichnungen fürs Widget** |
| 10 Erinnerungen | **Unbegrenzte Erinnerungen** |
| | **3 Themen-Fragen täglich** (Tiefgang 🌊, Zukunft 🏡, Prickelnd 🌶️) |

Preisvorschlag: **2,99 €/Monat** und **19,99 €/Jahr** (Jahresabo mit 7 Tagen gratis).

**Ablauf:** App kauft über RevenueCat → ruft die Edge Function `plus` auf → die fragt RevenueCat und setzt
`couples.plus_until` → beide Handys sehen Plus sofort. Verlängerungen/Kündigungen meldet RevenueCat an dieselbe
Funktion (Webhook). Nutzer können `plus_until` selbst nicht ändern.

> Geheime Schlüssel (RevenueCat-Secret, Webhook-Passwort) gehören **nur** in die Supabase-Secrets –
> nie in `.env`, nie in die App, nie in einen Chat.

## 1. App Store Connect: Abo anlegen (Vertrag für kostenpflichtige Apps muss „Aktiv“ sein)

1. App → **Monetarisierung → Abonnements** → **„+“ Abonnementgruppe**: Name `Wir zwei Plus`.
2. In der Gruppe **„+“ Abonnement** – zweimal:
   - Referenzname `Plus monatlich`, Produkt-ID `wirzwei_plus_monthly`, Dauer **1 Monat**
   - Referenzname `Plus jährlich`, Produkt-ID `wirzwei_plus_yearly`, Dauer **1 Jahr**
3. Für beide: **Preis** festlegen, **Lokalisierung Deutsch** (Anzeigename „Wir zwei Plus“, Beschreibung
   „Zeichnungen, unbegrenzte Erinnerungen und Themen-Fragen für euch beide“), **Screenshot für die Prüfung**
   (Bildschirmfoto der Plus-Seite aus der App).
4. Jahresabo optional: **Einführungsangebot** → kostenloser Testzeitraum 1 Woche.
5. **App-Store-Freigabe**: Die Abos werden zusammen mit dem nächsten App-Update eingereicht
   (in der Version unter „In-App-Käufe und Abonnements“ hinzufügen).

## 2. RevenueCat (kostenlos bis 2.500 $ Monatsumsatz)

1. https://app.revenuecat.com → Konto → **Projekt** `Wir zwei`.
2. **App hinzufügen → App Store**: Bundle-ID `de.wirzwei.app`. Für die Verbindung braucht RevenueCat einen
   **In-App-Purchase-Key** aus App Store Connect (Benutzer und Zugriff → Integrationen → In-App-Kauf → Schlüssel
   erzeugen, .p8-Datei bei RevenueCat hochladen).
3. **Products** → beide Produkt-IDs importieren.
4. **Entitlements** → neues Entitlement mit Identifier **`plus`** → beide Produkte zuordnen.
5. **Offerings** → `default` (als *current*) → Pakete **Monthly** (monatlich) und **Annual** (jährlich).
6. **API Keys**: den öffentlichen App-Key (`appl_…`) in `.env` bei `EXPO_PUBLIC_REVENUECAT_IOS_KEY` eintragen
   (der darf in die App). Den **Secret Key V1** (`sk_…`) nur in Schritt 3 bei Supabase eintragen.

## 3. Supabase: Funktion `plus` anlegen (alles im Browser)

1. Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Name: `plus`. Den gesamten Inhalt von `supabase/functions/plus/index.ts` einfügen → **Deploy**.
3. In den Einstellungen der Funktion **„Verify JWT“ ausschalten** (die Funktion prüft selbst).
4. **Edge Functions → Secrets** → zwei Einträge:
   - `REVENUECAT_SECRET_KEY` = Secret Key V1 aus RevenueCat
   - `REVENUECAT_WEBHOOK_SECRET` = ein langes Zufallspasswort (z. B. aus einem Passwortmanager)

## 4. RevenueCat-Webhook

RevenueCat → **Integrations → Webhooks** → URL
`https://qzrnhlyvgiunzulsgpvb.supabase.co/functions/v1/plus`,
Authorization-Header: `Bearer <dein REVENUECAT_WEBHOOK_SECRET>`.

## 5. Limit einschalten (erst wenn Plus im Store kaufbar ist)

Supabase SQL Editor: `update public.app_settings set plus_enabled = true;`
Vorher gibt es kein 10-Erinnerungen-Limit.

## 6. Neuer Build

`.env` enthält jetzt den RevenueCat-Key → `git pull`, bauen, hochladen. Kaufen in TestFlight läuft über die
**Sandbox** (kein echtes Geld). Zum Testen: App Store Connect → Benutzer und Zugriff → **Sandbox** → Testkonto
anlegen und auf dem iPhone unter Einstellungen → App Store → Sandbox-Account anmelden.
