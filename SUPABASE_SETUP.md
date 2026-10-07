# Server einrichten (Supabase)

Einmalig nötig, damit beide Handys dieselben Daten sehen. Alles geht im Handy-Browser.

1. **Projekt anlegen**: supabase.com → *Start your project* → registrieren → *New project*.
   Name `wir-zwei`, Passwort generieren lassen, Region **Frankfurt (eu-central-1)** → *Create*. Ca. 2 Minuten warten.
2. **Datenbank einrichten**: *SQL Editor* → *New query* → kompletten Inhalt von `supabase/schema.sql` einfügen → *Run*.
   Ergebnis muss „Success“ sein. Erneutes Ausführen schadet nicht.
3. **E-Mail-Bestätigung ausschalten**: *Authentication* → *Sign In / Providers* → *Email* → **Confirm email** aus →
   *Save*. Die App meldet mit E-Mail und Passwort an; so verschickt Supabase keine Mails und braucht kein eigenes SMTP.
4. **Passwort-Länge**: im selben Bereich *Minimum password length* auf **8** setzen (passt zur App).
5. **Zugangsdaten**: *Project Settings* → *API* (bzw. *API Keys*): **Project URL** und den **anon / publishable** Key kopieren
   und in `.env` eintragen. **Nicht** den `service_role` / `secret` Key.

Danach die App neu veröffentlichen (`eas update`).
