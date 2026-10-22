# Testplan vor dem Einreichen (2 Handys, 2 Konten)

**Bereits automatisch getestet** (lokales Supabase + Browser, siehe `e2e/`): Registrierung, Familie anlegen, Beitritt per
Code, Umgangsplan, Nachricht, Ausgabe + Bestätigung, Entscheidung + Antwort, Übergabe + Widerspruch, Kind-Info,
Elternvereinbarung + Zustimmung, Einführung, Dokumente (PDF, Gesundheit nur mit Einwilligung), Datenexport, Fachkraft einladen → zustimmen → Fachkraft liest → Kurzbericht, Tagebuch, Hilfe,
Allein-Start-Hinweis, Unterhalt (Betrag, Zahlung, Bestätigung), Packliste (abhaken, zurücksetzen), Schulferien
(Bundesland, Aufteilung vorschlagen). Kalender-Abo: Inhalt (ICS) per SQL-Test und Kalender-Parser geprüft.
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
| 11 | App-Sperre einschalten (Einstellungen) | Face ID/Code wird abgefragt; nach >30 s im Hintergrund erneut; in der App-Übersicht ist der Inhalt verdeckt |
| 12 | App-Sperre ohne Gerätecode | Hinweis „Richte zuerst einen Code … ein“, Schalter bleibt aus |
| 13 | Erinnerung: Plan mit Wechsel morgen | Heute 19 Uhr Mitteilung „Morgen ist Übergabe – Mia geht zu … · 17:00 Uhr · Kita“; Tippen öffnet Kalender |
| 14 | Erinnerung ausschalten | keine Mitteilung mehr; nach Abmelden ebenfalls keine |
| 15 | Dokument fotografieren und als PDF hochladen | erscheint bei beiden; Antippen öffnet Foto/PDF |
| 16 | Daten exportieren | Teilen-Dialog mit JSON-Datei |
| 17 | E-Mail ändern | Bestätigungs-Mail an neue Adresse (in Supabase *Secure email change* prüfen) |
| 18 | Kalender-Abo iPhone: Mehr → Im Handy-Kalender → Kalender abonnieren | Kalender „Zwei Zuhause“ mit „Mia bei …“ und Übergaben; nach Tausch spätestens nach einigen Stunden aktualisiert |
| 19 | Kalender-Abo Google: Link teilen → calendar.google.com → Per URL | Kalender erscheint; „Neuen Link erzeugen“ → alter Link liefert nichts mehr |
| 20 | Unterhalt: B trägt Zahlung ein, A hat App geschlossen | A bekommt „💶 … hat eine Unterhaltszahlung eingetragen“; Tippen öffnet Unterhalt |
