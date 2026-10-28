# Rückgabe: Website www.offifix.com (Stand 28.10.2026)

Gebaut nach `WEBSITE_AUFTRAG.md` (Stand 28.10.2026). Ordner: `website/`. Reines HTML und CSS, kein JavaScript, keine Cookies, keine externen Quellen.

> **Wichtig vorab**
> 1. **Der Ordner `logo/` lag nicht vor.** In `website/assets/logo/` liegen **Platzhalter mit den gleichen Dateinamen** (sichtbar beschriftet mit „LOGO-PLATZHALTER“). Die echten Dateien einfach darüber kopieren, danach `assets/img/og-image.png` neu erzeugen. Dieses Bild zeigt im Moment den Schriftzug als Text und nicht das echte Logo.
> 2. Die Stufen W1 bis W4 wurden in einem Durchgang gebaut. Claim, „du“ und Struktur sind **Vorschläge**. Die Entscheidungen stehen unten unter „Offene Fragen“ und lassen sich schnell ändern.

## 1. Seiten

| Pfad | Zweck |
|---|---|
| `/` (`index.html`) | Startseite: Hero, Problem, Ablauf eines Auftrags (7 Schritte), Funktionen, Gewerke, Fair zu Mitarbeitern, Digitaler Mitarbeiter (kommt), Preise kurz, FAQ, Abschluss |
| `/preise/` | Grundpaket und Module mit Beschreibung, Testphase, Einrichtungshilfe (Tabelle) |
| `/impressum/` | Impressum mit Platzhaltern, als Entwurf gekennzeichnet |
| `/datenschutz/` | Datenschutz der Website (Vercel, Server-Logfiles, kein Tracking), als **Entwurf** gekennzeichnet |
| `/datenschutz-app/` | Pflicht-URL für die App-Stores. **Nur Platzhalter** `[[DATENSCHUTZ_APP_TEXT]]`, Cans Claude füllt ihn aus dem Repo |
| `/agb/` | Platzhalter `[[AGB_TEXT]]`, `noindex` |
| `robots.txt`, `sitemap.xml` | SEO (AGB bewusst nicht in der Sitemap) |

Technik:
- Ein Stylesheet: `assets/site.css`.
- Schriften Sora und Figtree als WOFF2 selbst eingebunden; OFL-Lizenzen liegen in `assets/fonts/`.
- CSP als `<meta>` in jeder Seite: `default-src 'self'; script-src 'none'; …`. Empfehlung an Can: dieselbe CSP zusätzlich als HTTP-Header setzen, plus `frame-ancestors 'none'`, das als Meta nicht wirkt.
- Relative Links: Die Seiten lassen sich lokal öffnen und funktionieren auch unter www.offifix.com.

Geprüft:
- **390 px und 1440 px**: kein seitliches Scrollen auf allen 6 Seiten. Geprüft per Chromium mit `scrollWidth == innerWidth`.
- Keine Ladefehler.
- Keine `<script>`-Tags, kein `style=""`, keine fremden Domains außer den Links auf `app.offifix.com/anfrage` und `/login`.

## 2. Aussagen über Funktionen (mit Quelle)

| Aussage auf der Website | Wo | Quelle |
|---|---|---|
| Aufmaß-Blatt mit Formeln, Import aus Laser-Aufmaß-Bericht, Mengen mit einem Klick ins Angebot | Ablauf 1, Gewerke | §2 Aufmaß, §9 |
| Angebot direkt auf dem Dokument, Leistungskatalog, Kalkulation mit Material-Einkauf und Aufschlag, GAEB-Import | Ablauf 2, Gewerke | §2 Angebote |
| Plantafel: Kolonnen und Mitarbeiter über Wochen, Urlaub und Doppelbuchungen, PC per Ziehen, Handy als Liste | Ablauf 3 | §2 Plantafel |
| Ein- und Auschecken per App, auch offline, Pausen, Baustellenwechsel; Vorarbeiter stempelt für die Kolonne | Ablauf 4, Gewerke | §2 Zeiterfassung |
| Feste Zeiten mit Tageszettel, Korrekturen mit Grund, Monatsbestätigung | Funktionen | §2 Zeiterfassung |
| Zusatzarbeit mit Fotos, Kundenfreigabe per Link, Zeit direkt auf die Zusatzarbeit | Ablauf 5, Gewerke | §2 Zusatzarbeit |
| Abschlags- und Schlussrechnung, Skonto, Mahnwesen, E-Rechnung ZUGFeRD/XRechnung, technisch validiert | Ablauf 6, FAQ | §2 Rechnungen, §9 Ja |
| E-Rechnung: „Ab wann du … musst, prüfst du am besten mit deinem Steuerberater.“ (keine Frist genannt) | FAQ | §9 Nein (Fristen) |
| DATEV-Buchungsstapel und Lohndaten als ZIP (ohne „zertifiziert/konform“) | Ablauf 7 | §2 Steuerberater-Paket, §9 |
| Baustellen mit Bereichen/Wohnungen, Bautagebuch, Fotos, Aufgaben, Dokumenten, Reststunden live | Funktionen, Gewerke | §2 Baustellen |
| Urlaub mit Freigabe und Resturlaub, Krankmeldung, „in der Planung sichtbar“ | Funktionen | §2 Abwesenheiten, Plantafel |
| Material: Preise, Rabatte, Material je Baustelle, Eingangsrechnungen | Funktionen, Gewerke | §2 Material |
| Soll und Ist je Auftrag, Überblick für den Chef | Funktionen, Gewerke | §2 Auswertung |
| Reparaturaufträge aufnehmen, verteilen, abrechnen, mit Fahrtzeit | Funktionen | §2 Reparatur-Service |
| Unterweisungen, Ersthelfer, Notfallinfos je Baustelle | Funktionen, Gewerke | §2 Arbeitsschutz |
| Standort nur beim Ein- und Auschecken, nur „am Ort/außerhalb“, keine Koordinaten, keine Route, kein Bewegungsprofil, keine Dauer-Ortung | Fair | §2, §9 Ja |
| Nichts wird still überschrieben, Korrekturen mit Grund und Verlauf | Fair | §9 Ja |
| „Mitarbeiter sehen und bestätigen ihre Stunden“ | Fair | §2 Monatsbestätigung. ⚠️ **Annahme**, dass der Mitarbeiter bestätigt; bitte mit Can prüfen |
| Kein Tracking, keine Werbung (App und Website) | Fair, FAQ, Fußzeile | §9 Ja, §8 |
| Daten in Frankfurt am Main, jeder Betrieb sieht nur seine Daten | Hero, FAQ | §2 Plattformen, §9 Ja |
| Chef-Ansicht im Browser; Mitarbeiter-App für Android und iPhone „kommt in Kürze“ in die Stores | FAQ, Fußzeile | §2 Plattformen |
| Digitaler Mitarbeiter „In Entwicklung … bereitet Büroarbeit vor. Du gibst frei.“ (keine Telefonie, keine Termine) | Abschnitt 6 | §9 Nein (nicht als fertig verkaufen) |
| 14 Tage Test, monatlich kündbar, Einrichtung 283 € / 487 € / 678 € netto | Preise, FAQ | §7 Beschlossen |
| App kostenlos, Kauf nur über die Website | FAQ, Preise | §7 |
| Gewerke: Maler, Dachdecker, Raumausstatter/Boden, Innenausbau/Trockenbau; 2 bis 25 Leute | Gewerke | §3 |

Bewusst **nicht** verwendet:
- DSGVO-konform, rechtssicher, GoBD, DATEV-zertifiziert, „erfüllt die E-Rechnungspflicht“.
- Alles zu Scan, AR, Kamera oder 3D.
- Namen, Kundenstimmen, Zahlen zu Kunden, Wettbewerber.
- Pausenabzug, „Vortag übernehmen“.

Die Gewerke-Kacheln kombinieren nur vorhandene Funktionen aus §2. Es sind keine gewerkspezifischen Sonderfunktionen erfunden.

## 3. Platzhalter `[[…]]`

**Preise:**
- `[[PREIS_GRUNDPAKET]]`
- `[[PREIS_MODUL_ANGEBOTE_RECHNUNGEN]]`
- `[[PREIS_MODUL_AUFMASS]]`
- `[[PREIS_MODUL_MATERIAL_LAGER]]`
- `[[PREIS_MODUL_AUSWERTUNG]]`
- `[[PREIS_MODUL_REPARATUR]]`

Sie stehen jeweils auf der Startseite und auf `/preise/`. Bitte an beiden Stellen eintragen, als Monatspreis ohne „/Monat“, das steht schon da.

**Stores:** `[[APP_STORE_URL]]`, `[[PLAY_STORE_URL]]` (Fußzeile auf allen Seiten). Die Abzeichen sind gestrichelte Text-Platzhalter. Beim Einsetzen bitte die **offiziellen Badge-Grafiken** von Apple und Google nach deren Richtlinien verwenden und nicht nachbauen.

**Impressum und Datenschutz:**
- `[[ANSCHRIFT]]`, `[[VERANTWORTLICH]]`, `[[REGISTER]]`, `[[UST_ID]]`, `[[TELEFON]]`
- `[[LOG_SPEICHERDAUER]]`: wie lange Vercel die Logs hält
- `[[AUFSICHTSBEHOERDE]]`: richtet sich nach dem Sitz der UG
- `[[LINK_DATENSCHUTZ_WEBAPP]]`: wo steht der Datenschutz von app.offifix.com?
- `[[PRUEFEN: Zertifizierung und Region bestätigen]]`: Vercel-DPF, Vercel-Anschrift und den Satz zur Auftragsverarbeitung prüfen

**Rechtstexte von Can bzw. Anwalt:** `[[DATENSCHUTZ_APP_TEXT]]`, `[[AGB_TEXT]]`

**Dateien:**
- alle Dateien in `assets/logo/` (siehe oben)
- `assets/img/og-image.png` nach dem Logo-Tausch neu erzeugen

## 4. Benötigte Bildschirmfotos

Zurzeit sind alles beschriftete Platzhalter-Rahmen. Format: WebP, mit `width`/`height`.

| # | Stelle | Bildschirm | Gerät | Hell/Dunkel | Seitenverhältnis |
|---|---|---|---|---|---|
| 1 | Hero | Chef-Ansicht: Überblick oder Plantafel | PC | dunkel | 16:10 |
| 2 | Hero | Mitarbeiter-App: Einchecken | Handy | dunkel | ca. 9:19 |
| 3 | Ablauf 1 | Aufmaß-Blatt | PC | dunkel | 16:9 |
| 4 | Ablauf 2 | Angebot bearbeiten (auf dem Dokument) | PC | hell | 16:9 |
| 5 | Ablauf 3 | Plantafel | PC | dunkel | 16:9 |
| 6 | Ablauf 4 | App: Stempeln / Kolonne | Handy | dunkel | 16:9-Rahmen, Handy mittig |
| 7 | Ablauf 5 | Zusatzarbeit mit Freigabe-Link | Handy | hell | 16:9-Rahmen, Handy mittig |
| 8 | Ablauf 6 | Rechnungen / Rechnung mit E-Rechnung | PC | hell | 16:9 |
| 9 | Ablauf 7 | Steuerberater-Paket (Export) | PC | dunkel | 16:9 |

Alle Fotos kommen aus dem Vorführbetrieb, ohne echte Kundendaten oder Namen.

## 5. Offene Fragen an die Gründer

1. **Claim:** Umgesetzt ist **„Weniger Büro. Mehr Baustelle.“** im Hero und „Nutzt du schon offi?“ im Abschluss.
   - „Das Büro erledigt sich.“ habe ich bewusst nicht in den Hero genommen. Solange der digitale Mitarbeiter noch nicht fertig ist, verspricht der Satz mehr, als die Software heute tut.
   - Philipp entscheidet. Die Änderung betrifft nur `<h1>` sowie og:title und og-image.
2. **„du“ oder „Sie“:** Durchgehend „du“, wie im Claim empfohlen. Rechtstexte sind neutral bzw. ebenfalls „du“.
3. **Preisstufen:** Grundpaket plus 5 Module, wie in §7. Offen:
   - Preis je Betrieb oder je Mitarbeiter?
   - Gibt es eine Mitarbeiter-Obergrenze im Grundpaket?
   - Gibt es Rabatt bei jährlicher Zahlung? Falls ja, braucht die Preisseite eine weitere Zeile.
4. **Monatsbestätigung:** Bestätigt der Mitarbeiter oder der Chef? Davon hängt ein Satz im Abschnitt „Fair“ ab.
5. **Impressum:** alle Angaben der UG (siehe Platzhalter).
6. **Datenschutz der Web-App:** Wo ist er verlinkt? Gilt er auch für das Anfrageformular?
7. **„Beratung anfragen“:** Umgesetzt als `mailto:info@offifix.com`, weil kein Formular erlaubt ist. Gibt es einen Terminlink, oder bleibt es bei E-Mail?
8. **404-Seite:** Ist eine eigene gewünscht? Bisher keine, Vercel zeigt dann die Standardseite.
9. **Preisseite:** Die Startseite zeigt die Preise kurz, `/preise/` ausführlich. Die Preise stehen deshalb an zwei Stellen. Falls das stört, kann der Abschnitt auf der Startseite auf einen Link verkürzt werden.
