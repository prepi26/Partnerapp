# Wir zwei 💖🌴

Eine App für Paare im Miami-Look (Flamingo-Pink & Ocean-Blau), gebaut mit Expo (SDK 57) und Expo Router.

Beide Partner nutzen die App auf ihrem eigenen Handy; alle Inhalte werden live über Supabase geteilt.

## Funktionen

- **Login per E-Mail-Code** und **Verbinden per Einladungscode** (6 Zeichen)
- **Zusammen-Zähler**: Tage, Jahre/Monate/Tage, Live-Sekunden und die nächsten Meilensteine
- **Stimmung**: jeder setzt täglich ein Emoji, der andere sieht es auf dem Startbildschirm
- **Frage des Tages**: die Antwort des Partners wird erst sichtbar, wenn man selbst geantwortet hat (serverseitig erzwungen)
- **Liebeszettel**: kleine Nachrichten wie in einem Chat
- **Momente**: Erinnerungen mit Foto, Datum und Text
- **Wünsche**: gemeinsame Bucket List mit Kategorien, Abhaken und Fortschrittsbalken
- **Daten & Dates**: Termine mit Countdown (Jahrestag automatisch) und Date-Ideen mit Zufallsgenerator

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
- `src/data/` – Login, gemeinsamer State mit Live-Updates, Typen, Fragen & Date-Ideen
- `src/lib/dates.ts` – Datumslogik
- `src/theme.ts` – Farben & Abstände

## Server (Supabase)

Einrichtung siehe [SUPABASE_SETUP.md](SUPABASE_SETUP.md). Datenbank, Zugriffsregeln (Row Level Security), Foto-Speicher und
Live-Updates stehen komplett in `supabase/schema.sql`. Zugangsdaten kommen in `.env`.
