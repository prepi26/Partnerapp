# Stand nach der Nacht (21.10.2026)

## Ehrlich vorweg

Die App ist **gebaut, getestet und hochladbereit vorbereitet – aber noch nicht hochladbar.** Dafür fehlen Dinge, die
nur du anlegen kannst (alles in `SETUP.md`, Reihenfolge beachten):

1. Supabase-Projekt anlegen, `schema.sql` ausführen, Keys in `.env`
2. `eas init` (Expo-Projekt), Apple-Developer-Konto (hast du schon von „Wir zwei“)
3. Abo in App Store Connect + RevenueCat
4. **Datenschutzerklärung, Nutzungsbedingungen, Impressum** veröffentlichen – Entwürfe liegen bereit, **bitte von
   einem Anwalt/Datenschutzberater prüfen lassen**. Bei Kinder- und Konfliktdaten ist das kein Formalismus.
5. Einmal mit zwei echten Handys den `TESTPLAN.md` durchgehen (Push, Kamera, Kauf gehen nur auf Geräten)

## Was fertig ist

- **App** (`zwei-zuhause/`): Kalender mit Umgangsmodellen und Tausch, Kosten mit Saldo und Belegen, unlöschbare
  Nachrichten mit Prüfsummen-Kette und Ton-Check, Entscheidungen (§ 1687 BGB), Übergabe-Protokoll, Infos zum Kind,
  Elternvereinbarung mit Fassungen, privates Tagebuch, PDF-Kurzbericht und Vollbericht, **Fachkraft-Zugang** für
  Jugendamt/Beratung (beide Eltern stimmen zu, befristet, nie das Tagebuch), Hilfe-Seite mit Notfallnummern,
  Push-Mitteilungen ohne Inhalt, Abo „Plus“ pro Elternteil.
- **Getestet**: Datenbankregeln mit SQL-Tests (Fremde, Fachkräfte, Fälschungsversuche), komplette Abläufe mit zwei
  Eltern und einer Fachkraft gegen ein echtes lokales Supabase im Browser, Speicherregeln für Belege, Typecheck, Lint,
  `expo-doctor`. Ein unabhängiger Code-Review fand 8 Sicherheitslücken – alle behoben und getestet.
- **Marke**: 5 Namensvorschläge, 3 Logo-Konzepte, App-Icon eingebaut (`MARKE.md`, `branding/`)
- **Store**: Texte, Keywords, 6 fertige Screenshots in 1290×2796 (`STORE.md`, `store/screenshots/`)
- **Jugendamt**: Info-Blatt und Pilot-Plan für dein Netzwerk (`JUGENDAMT.md`)
- **Recherche** mit Quellen (`RECHERCHE.md`)

## Entscheidungen, die bei dir liegen

1. **Name:** „Zwei Zuhause“ behalten? (Alternativen in `MARKE.md`; DPMA-Recherche noch offen)
2. **Fachkraft-Zugang:** Jetzt müssen *beide* Eltern zustimmen. Fair und datenschutzfreundlich – aber ein
   blockierender Elternteil kann so das Jugendamt aussperren. Soll *ein* Elternteil reichen (der andere sieht es nur)?
3. **Preis:** 4,99 €/Monat · 39,99 €/Jahr pro Elternteil – oder ein Familien-Abo (beide zahlen einmal)?
4. **Was gehört in Plus?** Aktuell nur PDF-Berichte und Belegfotos. Alles andere gratis, damit Jugendämter die App
   ohne schlechtes Gewissen empfehlen können.
5. **Wer darf als Fachkraft?** Jeder mit Code – oder nur verifizierte Fachkräfte (Dienst-E-Mail)?
6. **„Wir zwei“:** Dein Plan sagt 500 Downloads bis 31.12. Wie viel Zeit geht in welches Projekt?

## Nächste sinnvolle Schritte

1. 3–5 Fachkräfte aus deinem Netzwerk 20 Minuten draufschauen lassen (Fragen in `JUGENDAMT.md`) – **bevor** wir weiterbauen
2. Phase 2 je nach Feedback: Gewaltschutz-Modus, Schulferien je Bundesland, Unterhalt Soll/Ist, KI-Umformulierung
