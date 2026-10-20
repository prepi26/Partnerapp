# Version 1.2

## Neu

- **Widgets** (Home- und Sperrbildschirm):
  - „Zusammen-Zähler“: Namen, Tage zusammen, 💍-Countdown – zählt um Mitternacht selbst weiter.
  - „Zeichnung“: die neueste Zeichnung des Partners (klein/mittel/groß, rund/rechteckig auf dem Sperrbildschirm).
- **Malen** (Plus, solange Plus noch nicht kaufbar ist für alle): Startseite → „Mal … etwas“. Der Partner bekommt eine
  Mitteilung; die App wird im Hintergrund geweckt und aktualisiert das Widget (iOS entscheidet, wie oft – spätestens
  beim Öffnen der App ist es aktuell).
- **Quiz „Wie gut kennst du mich?“**: täglich 3 Fragen – erst über dich, dann Tipp für den Partner. Ergebnis, sobald
  beide gespielt haben; Mitteilung an den Partner.
- **Herz-Rangliste** (Heute/Woche/Monat/Jahr) und **50 Paar-Erfolge** in 5 Gruppen (auch übertriebene wie 100.000 Herzen).
- **Jahresrückblick** („Euer Jahr 2026“) als Bild zum Teilen.
- **Teilen-Karte** neu: Namen groß oben, Emojis optional, App-Store-Link wird mitgeschickt; Teilen hängt nicht mehr.
- **Dunkelmodus** (folgt der iPhone-Einstellung).
- **Absturzberichte** über Sentry (aktiv, sobald `EXPO_PUBLIC_SENTRY_DSN` in `.env` steht).
- **Plus mit In-App-Kauf** vorbereitet – Einrichtung siehe `PLUS_SETUP.md`.
- Behoben: Zurück-Knopf ohne „(tabs)“, Wünsche nur über den Kreis abhaken.

## 0. Supabase: Datenbank aktualisieren (Pflicht)

`supabase/schema.sql` kopieren (GitHub → „Copy raw file“), im SQL Editor **Run** → „Run and enable RLS“.
Neu: Tabellen `quiz_answers`, `drawings`, Funktionen `thought_stats` und `couple_stats`, Mitteilungen für Quiz und Zeichnungen.

## 1. Optional vor dem Build

- **Plus** einrichten (`PLUS_SETUP.md`) – dann den RevenueCat-Key in `.env` eintragen lassen, bevor du baust.
  Ohne Key ist Plus unsichtbar und alles frei.
- **Sentry**: https://sentry.io → Konto (Region **EU**) → Projekt „React Native“ → DSN kopieren und mir schicken
  (der DSN ist öffentlich und darf in den Chat) – ich trage ihn ein.

## 2. Bauen (PowerShell)

```
cd Partnerapp
git pull
npm install
$env:EXPO_APPLE_ID = "prepitoys" + [char]64 + "gmail.com"
npx eas-cli@latest build --platform ios --profile production
```

Neu bei diesem Build:
- Profil für das **Widget** (`de.wirzwei.app.widget`) anlegen → **Y**
- **Capabilities / App Groups** abgleichen → **Y**
- Alles andere → Enter

Schlägt der Build fehl: expo.dev-Link öffnen → roten Schritt anklicken → Screenshot der ersten roten Zeile schicken.

Danach: `npx eas-cli@latest submit --platform ios --latest`

## 3. Testen (TestFlight, beide Handys)

1. Startseite: Herz-Rangliste, Quiz-Kachel, Malen-Kachel, Erfolge, Jahresrückblick sichtbar?
2. Quiz spielen – bei beiden, Ergebnis + Mitteilung prüfen.
3. Malen → senden → beim anderen: Mitteilung, Zeichnung in der App, Widget „Zeichnung“ aktualisiert?
4. Widgets hinzufügen: Home-Bildschirm lange drücken → „Bearbeiten“ → „Widget hinzufügen“ → „Wir zwei“.
5. iPhone auf Dunkelmodus stellen (Kontrollzentrum) → alle Bildschirme lesbar?
6. Teilen-Karte mehrmals hintereinander teilen und abbrechen.

## 4. App Store Connect

- Version **1.2.0** anlegen, Build wählen.
- App-Datenschutz ergänzen, falls Sentry aktiv: **Diagnose → Absturzdaten**, nicht verknüpft, kein Tracking.
- Bei Plus: Abos unter „In-App-Käufe und Abonnements“ zur Version hinzufügen.
- „Neuerungen in dieser Version“:

```
Riesen-Update! Euer Zusammen-Zähler und eure Zeichnungen als Widget für Home- und Sperrbildschirm. Neu: das tägliche Quiz „Wie gut kennst du mich?“, die Herz-Rangliste, 50 Paar-Erfolge und euer Jahresrückblick zum Teilen. Außerdem: Dunkelmodus, schönere Teilen-Karte mit eigenem Foto und viele kleine Verbesserungen.
```
