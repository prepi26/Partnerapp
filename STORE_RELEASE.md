# In den App Store und Google Play bringen

## Was du selbst anlegen musst (kann Claude nicht für dich tun)

| | Kosten | Wofür |
|---|---|---|
| Apple Developer Program | 99 $ / Jahr | App Store, TestFlight |
| Google Play Console | 25 $ einmalig | Play Store |
| Expo-Konto + `EXPO_TOKEN` | kostenlos (Free-Tier-Builds) | Builds in der Cloud (EAS) |
| Supabase-Projekt | kostenlos | Server, siehe SUPABASE_SETUP.md |
| Datenschutzerklärung unter einer öffentlichen URL | – | Pflicht in beiden Stores, Entwurf: PRIVACY.md |

## Ablauf

1. Supabase einrichten und URL + Key in `.env` eintragen.
2. `npx eas-cli@latest build --platform all --profile production` – baut iOS- und Android-Versionen in der Cloud.
3. `npx eas-cli@latest submit --platform ios` / `--platform android` – lädt sie zu App Store Connect / Play Console hoch.
4. In App Store Connect und Play Console: Beschreibung, Screenshots, Datenschutz-URL, Altersfreigabe, Fragebogen
   „App-Datenschutz“ bzw. „Datensicherheit“ ausfüllen (Daten: E-Mail, Fotos, Nutzerinhalte; kein Tracking).
5. **Test-Login für die Prüfer:** In Supabase unter *Authentication → Users → Add user* ein Prüf-Konto mit E-Mail und
   Passwort anlegen (*Auto Confirm User* an) und die Zugangsdaten in App Store Connect unter *App Review Information*
   eintragen. Am besten vorher mit diesem Konto ein Paar anlegen, damit die Prüfer gleich Inhalte sehen.
6. Zur Prüfung einreichen. Apple braucht meist 1–3 Tage, Google einige Stunden bis Tage.

## Zum Testen vorher

`npx eas-cli@latest build --platform android --profile preview` liefert eine APK zum direkten Installieren.
Für iPhones läuft der Test über TestFlight (nach Schritt 2 und 3).

## Bereits erledigt

- App-Kennung `de.wirzwei.app` (iOS und Android), Icon, Splash, EAS-Build-Profile (`eas.json`)
- Konto-Löschung in der App (Apple-Pflicht, Richtlinie 5.1.1(v))
- Exportkontrolle: `ITSAppUsesNonExemptEncryption: false`
