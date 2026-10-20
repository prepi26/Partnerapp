# Version 1.2 – Widget „Zusammen-Zähler“

Neu:
- **Home-Bildschirm-Widget** (klein und mittel): Namen, Tage zusammen, bei Verlobten/Verheirateten der 💍-Countdown.
  Zählt um Mitternacht selbst weiter, auch wenn die App geschlossen bleibt.
- **Sperrbildschirm-Widgets**: rund (♥ + Tage), rechteckig („♥ 977 Tage – mit Max“) und über der Uhr.

Technik: `targets/widget/` (SwiftUI, Plugin `@bacons/apple-targets`), App Group `group.de.wirzwei.app`.
Die App schreibt Namen/Datum/Status über `src/lib/widget.ts` in die App Group.

## 1. Bauen (PowerShell)

```
cd Partnerapp
git pull
npm install
$env:EXPO_APPLE_ID = "prepitoys" + [char]64 + "gmail.com"
npx eas-cli@latest build --platform ios --profile production
```

Neu bei diesem Build – EAS richtet das Widget als zweites „Ziel“ ein:
- „Do you want to log in to your Apple account?“ → **Y** (wird für das neue Widget-Profil gebraucht)
- Fragen zu einem neuen **Provisioning Profile** / **Distribution Certificate** für `de.wirzwei.app.widget` → **Y**
- Fragen zu **Capabilities / App Groups** synchronisieren → **Y**
- Alles andere → Enter

Danach:
```
npx eas-cli@latest submit --platform ios --latest
```

## 2. Widget auf dem iPhone hinzufügen (TestFlight-Build)

1. App einmal öffnen (sie schreibt dabei eure Daten für das Widget).
2. Home-Bildschirm: lange auf eine freie Stelle drücken → oben links **„Bearbeiten“** → **„Widget hinzufügen“**.
3. **„Wir zwei“** suchen → klein oder mittel wählen → **„Widget hinzufügen“**.
4. Sperrbildschirm: lange drücken → **„Anpassen“** → **Sperrbildschirm** → Feld unter der Uhr → **„Wir zwei“**.

## 3. App Store Connect

Version **1.2.0** anlegen, Build wählen, „Neuerungen in dieser Version“:
```
Neu: Euer Zusammen-Zähler als Widget! Legt ihn auf den Home-Bildschirm oder den Sperrbildschirm und seht jederzeit, wie viele Tage ihr schon zusammen seid – mit Countdown zur Hochzeit für Verlobte.
```
Optional: einen Screenshot mit Widget in die Screenshots aufnehmen.
