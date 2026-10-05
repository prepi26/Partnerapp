# Wir zwei 💖🌴

Eine App für Paare im Miami-Look (Flamingo-Pink & Ocean-Blau), gebaut mit Expo (SDK 57) und Expo Router.

## Funktionen

- **Zusammen-Zähler**: Tage, Jahre/Monate/Tage, Live-Sekunden und die nächsten Meilensteine (100 Tage, halbes Jahr, Jahrestage …)
- **Erinnerungen**: Timeline nach Monaten, mit Foto, Datum und Text
- **Wünsche**: gemeinsame Bucket List mit Kategorien, Abhaken und Fortschrittsbalken
- **Wichtige Daten**: Geburtstage, Jahrestage & Co. mit Countdown (euer Jahrestag ist automatisch drin)

## Mit Expo Go testen

```bash
npm install
npx expo start
```

QR-Code mit der **Expo Go** App (iOS: Kamera-App, Android: in Expo Go) scannen. Handy und Rechner müssen im selben WLAN sein – sonst `npx expo start --tunnel`.

## Entwicklung

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
```

Struktur:

- `src/app/` – Screens (Expo Router, jede Datei = eine Route)
- `src/components/` – UI-Bausteine
- `src/data/` – State, Typen und Speicherung
- `src/lib/dates.ts` – Datumslogik
- `src/theme.ts` – Farben & Abstände

## Daten & Sync

Aktuell werden alle Daten **nur lokal** auf dem Gerät gespeichert (AsyncStorage, Fotos im App-Dokumentenordner). Echtes Teilen zwischen zwei Handys braucht ein Backend: dafür wird `StateStorage` in `src/data/storage.ts` durch eine Supabase- oder Firebase-Implementierung ersetzt.
