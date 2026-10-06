# Server einrichten (Supabase)

Einmalig nötig, damit beide Handys dieselben Daten sehen. Alles geht im Handy-Browser.

1. **Projekt anlegen**: supabase.com → *Start your project* → registrieren → *New project*.
   Name `wir-zwei`, Passwort generieren lassen, Region **Frankfurt (eu-central-1)** → *Create*. Ca. 2 Minuten warten.
2. **Datenbank einrichten**: *SQL Editor* → *New query* → kompletten Inhalt von `supabase/schema.sql` einfügen → *Run*.
   Ergebnis muss „Success“ sein. Erneutes Ausführen schadet nicht.
3. **Code statt Link per E-Mail**: *Authentication* → *Emails* (bzw. *Email Templates*).
   In den Vorlagen **Magic Link** und **Confirm signup** den Inhalt ersetzen durch:

   ```html
   <h2>Dein Code für Wir zwei</h2>
   <p>Gib diesen Code in der App ein:</p>
   <p style="font-size:32px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
   ```
4. **Partner freischalten**: Ohne eigenen E-Mail-Dienst verschickt Supabase Mails nur an Mitglieder des Teams.
   *Organization* → *Team* → *Invite* → E-Mail des Partners einladen (Rolle egal, z. B. Read-only).
5. **Zugangsdaten**: *Project Settings* → *API* (bzw. *API Keys*): **Project URL** und den **anon / publishable** Key kopieren
   und in `.env` eintragen. **Nicht** den `service_role` / `secret` Key.

Danach die App neu veröffentlichen (`eas update`).
