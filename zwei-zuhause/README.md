# Zwei Zuhause

Co-Parenting-App für getrennt lebende Eltern (DACH): Umgang, Kosten, Nachrichten, Entscheidungen, Übergaben,
Elternvereinbarung, Infos zum Kind, privates Tagebuch – und ein Lesezugang für Jugendamt und Beratung.

Expo SDK 57 · Expo Router · Supabase (EU) · RevenueCat. Eigenständiges Projekt neben „Wir zwei“ im selben Repository.

## Dokumente

| Datei | Inhalt |
|---|---|
| `docs/SETUP.md` | **Hier anfangen**: Supabase, EAS, Abo, Pflichtseiten, App Store |
| `docs/RECHERCHE.md` | Probleme getrennter Eltern, Wettbewerb, Recht, Jugendamt – mit Quellen |
| `docs/MARKE.md` | Namensvorschläge, Logo-Konzepte, Farben |
| `docs/STORE.md` | Store-Texte, Keywords, Screenshot-Plan |
| `docs/JUGENDAMT.md` | Info-Blatt für Fachkräfte und Pilot-Plan |
| `docs/DATENSCHUTZ.md`, `docs/NUTZUNGSBEDINGUNGEN.md` | Entwürfe – anwaltlich prüfen lassen |
| `docs/TESTPLAN.md` | Was vor dem Einreichen auf echten Handys zu testen ist |

## Entwickeln

```bash
npm install
cp .env.example .env   # Supabase-URL und anon-Key eintragen
npx expo start
npx tsc --noEmit && npx expo lint
```

Datenbankregeln testen (lokales Postgres): `supabase/test-run.sh supabase/test-rls.sql` (ebenso `test-features.sql`,
`test-pro.sql`). Ende-zu-Ende im Browser: `e2e/local-stack.sh`, dann `node e2e/flow-basics.js`.

## Aufbau

- `src/app/` – Bildschirme (Expo Router). Tabs: Heute, Kalender, Kosten, Nachrichten, Mehr.
  Fachkräfte landen auf `cases` → `case/[id]`.
- `src/data/store.tsx` – alle Daten der Familie, Live-Updates über Supabase Realtime
- `src/lib/` – Umgangsmodelle (`schedule.ts`), Geld (`money.ts`), PDF (`report.ts`), Ton-Check (`tone.ts`)
- `supabase/schema.sql` – Tabellen, Zugriffsregeln (RLS), Prüfsummen, Push-Trigger

## Bewusste Grenzen von Version 1

- Plus (PDF, Belegfotos) wird in der App geprüft, nicht auf dem Server – reicht für den Start.
- Kein KI-Ton-Assistent (nur Regel-basierter Ton-Check), keine Schulferien-Daten, kein Unterhalts-Soll/Ist,
  kein Gewaltschutz-Modus – siehe Phase 2 in `docs/RECHERCHE.md`.
- Nur Deutsch.
