# Testplan vor dem Einreichen (2 Handys, 2 Konten)

**Bereits automatisch getestet** (lokales Supabase + Browser, siehe `e2e/`): Registrierung, Familie anlegen, Beitritt per
Code, Umgangsplan, Nachricht, Ausgabe + Bestätigung, Entscheidung + Antwort, Übergabe + Widerspruch, Kind-Info,
Elternvereinbarung + Zustimmung, Fachkraft einladen → zustimmen → Fachkraft liest → Kurzbericht, Tagebuch, Hilfe.
Datenbankregeln: `supabase/test-*.sql`.

**Nur auf echten Geräten prüfbar** – bitte einmal durchgehen:

| # | Test | Erwartung |
|---|---|---|
| 1 | Push: A schreibt Nachricht, B hat App geschlossen | B bekommt „Neue Nachricht von …“ ohne Inhalt; Tippen öffnet Nachrichten |
| 2 | Live-Update: beide Apps offen, A trägt Ausgabe ein | erscheint bei B ohne Neuladen |
| 3 | Belegfoto mit Kamera (Plus, Sandbox-Kauf) | Foto erscheint in der Ausgabe bei beiden |
| 4 | PDF Kurzbericht + vollständig | Teilen-Dialog, PDF lesbar, Umlaute korrekt |
| 5 | Plus kaufen / wiederherstellen (Sandbox-Konto) | Plus aktiv, Bericht ohne Paywall |
| 6 | Dunkelmodus (iOS) | alles lesbar |
| 7 | Passwort vergessen | Code-Mail kommt, neues Passwort funktioniert |
| 8 | Konto löschen bei A | B behält Kalender, Kosten, Nachrichten; A ist weg |
| 9 | Hilfe → Notruf-Buttons | Telefon-App öffnet sich mit Nummer |
| 10 | Kleines iPhone (SE) | Kalender und Formulare passen |
