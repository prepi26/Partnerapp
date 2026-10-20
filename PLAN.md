# Plan „Wir zwei“ (Stand: 20. Oktober 2026)

Ergebnis der „grill me“-Runde. Am **15. November** und am **31. Dezember** hier nachsehen.

## Entscheidungen

| # | Thema | Entscheidung |
|---|---|---|
| 1 | Erste Nutzer | Freunde & Familie |
| 2 | Wachstum danach | Mundpropaganda (Einladungs-Link, Teilen-Karte) |
| 3 | Messen | App Store Analytics (Downloads) |
| 4 | Ziel | **500 Downloads bis 31.12.2026** |
| 5 | Plan B | Am **15.11.** unter 150 Downloads → kleinen Werbe-Test starten |
| 6 | Preis Plus | **2,99 €/Monat · 19,99 €/Jahr** (Jahresabo 7 Tage gratis) |
| 7 | Serverkosten | Supabase Pro (25 $/Monat) ab **50 aktiven Paaren** |
| 8 | Version 1.2 | Plus mit rein, erst mit Janina testen, dann einreichen (ca. 1 Woche) |
| 9 | Android | Erst ab 500 iPhone-Downloads |
| 10 | Android-Bedarf messen | Nein |

## Offene Risiken

1. **Android-Zwickmühle:** Ohne Android scheitern viele Paare an „Mein Partner hat Android“ – das bremst genau das
   500er-Ziel, das Android freischalten soll. (Empfehlung war: Android direkt nach 1.2.)
2. **Mundpropaganda ohne aktiven Kanal:** ~50 Downloads/Woche sind ohne Clips/Werbung schwer → Zwischenstand 15.11. ernst nehmen.
3. **Downloads ≠ aktive Paare:** Zusätzlich in Supabase (Table Editor → couples, Spalte partner_b gefüllt) zählen.
4. **Werbe-Obergrenze:** Vor dem Test festlegen, was ein Download höchstens kosten darf (Vorschlag: 3 €).
5. **1.2 technisch riskant:** Widgets ungetestet – 1–2 Korrekturrunden einplanen.

## Nächste Schritte

| Wer | Was | Bis wann |
|---|---|---|
| Philipp | `schema.sql` in Supabase ausführen | heute |
| Philipp | Plus einrichten nach `PLUS_SETUP.md` | sobald Apple freischaltet |
| Claude | RevenueCat-Key in `.env` eintragen | direkt danach |
| Philipp | Build 1.2, mit Janina testen, Fehler melden | diese Woche |
| Philipp | Einladungs-Link an 20–30 befreundete Paare + um Bewertung bitten | nach Release 1.2 |
| Philipp | Downloads in App Store Connect → Analyse notieren | jeden Sonntag |
| Philipp | Zwischenstand prüfen; unter 150 → Werbe-Test | 15.11.2026 |

## Download-Protokoll

| Datum | Downloads gesamt | Paare (verbunden) | Notiz |
|---|---|---|---|
| | | | |

## Version 1.3 (beschlossen, nach Release von 1.2)

1. **Termin-Erinnerungen**: Mitteilung vor Geburtstagen, Jahrestagen und eigenen Terminen.
2. **Brief mit Zeitschloss**: Vorlagen (z. B. „zum nächsten Jahrestag“, „Valentinstag“, „in einem Jahr“) **und** eigenes
   Datum; erst ab dem Datum lesbar; Schreibdatum sichtbar. Plus-Funktion.
3. **Sprachnachricht als Zettel**.
4. **App-Icon und Farbthema wählbar** (Plus).
5. **Stimmungs-Verlauf** (Kurve der letzten 30 Tage).

Offen / später: Foto des Tages, „Unser Song“, Android.
