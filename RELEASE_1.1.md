# Version 1.1 – Mitteilungen und „Passwort vergessen“

Neu in der App:
- **Push-Mitteilungen** an den Partner bei: „Ich denk an dich“, neuer Zettel, Antwort auf die Frage des Tages,
  neue Erinnerung. Die Mitteilungen enthalten nie den Inhalt (nur Vorname und einen festen Hinweis).
  Antippen öffnet den passenden Bildschirm.
- **Passwort vergessen** im Login: Code per E-Mail, dann neues Passwort.
- Tastatur schließt sich nach dem Schreiben, Einladungscode lässt sich aus einer Nachricht einfügen (aus 1.0.1).

## 1. Supabase: Datenbank aktualisieren

1. https://github.com/prepi26/Partnerapp/blob/claude/couples-app-design-6h78o7/supabase/schema.sql öffnen
   → oben rechts „Copy raw file“.
2. https://supabase.com/dashboard/project/qzrnhlyvgiunzulsgpvb/sql/new → einfügen → **Run**.
3. Ergebnis: Tabelle mit Codes oder „Success“. Links unter Database → Tables gibt es jetzt `push_tokens`.

## 2. Supabase: E-Mail-Versand einrichten (für „Passwort vergessen“)

Ohne eigenen E-Mail-Server schickt Supabase nur an Mitglieder des Projekts – fremde Nutzer bekämen keinen Code.

**Gmail-App-Passwort erstellen** (das Passwort gehört nur in Supabase, nie in einen Chat):
1. https://myaccount.google.com/apppasswords (Bestätigung in zwei Schritten muss an sein).
2. Name „Supabase“ → Erstellen → das 16-stellige Passwort kopieren.

**In Supabase:** Authentication → Emails → **SMTP Settings** → „Enable custom SMTP“:

| Feld | Wert |
|---|---|
| Sender email | prepitoys@gmail.com |
| Sender name | Wir zwei |
| Host | smtp.gmail.com |
| Port | 465 |
| Username | prepitoys@gmail.com |
| Password | das App-Passwort von oben |

Speichern.

**Vorlage ändern:** Authentication → Emails → Templates → **Reset Password**

Betreff:
```
Dein Code für Wir zwei
```
Inhalt (alles ersetzen):
```html
<h2>Neues Passwort für Wir zwei</h2>
<p>Dein Code lautet:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>Gib ihn in der App ein. Er gilt eine Stunde.</p>
<p>Du hast das nicht angefordert? Dann ignoriere diese E-Mail einfach.</p>
```
Speichern.

## 3. Bauen und hochladen (PowerShell)

```
cd Partnerapp
git pull
npm install
npx eas-cli@latest build --platform ios --profile production
```
EAS fragt nach Push-Mitteilungen → beide Fragen mit **Y** (Ja) beantworten
(„set up Push Notifications“ und „Generate a new Apple Push Notifications service key“).

Danach:
```
npx eas-cli@latest submit --platform ios --latest
```

## 4. Testen (TestFlight, beide Handys)

1. Beide installieren den neuen Build, öffnen die App und tippen bei der Frage nach Mitteilungen auf **Erlauben**.
2. App bei einem Handy schließen. Vom anderen Herz, Zettel, Antwort, Erinnerung senden → Mitteilung kommt.
3. Abmelden → „Passwort vergessen?“ → Code kommt per E-Mail → neues Passwort setzen.

## 5. App Store Connect

Neue Version **1.1.0** anlegen, Build wählen, „Neuerungen in dieser Version“:
```
Neu: Mitteilungen, wenn dein Schatz an dich denkt, dir einen Zettel schreibt oder die Frage des Tages beantwortet. Außerdem kannst du dein Passwort jetzt selbst zurücksetzen, und die Tastatur schließt sich nach dem Schreiben automatisch.
```
Zur Prüfung hinzufügen.
