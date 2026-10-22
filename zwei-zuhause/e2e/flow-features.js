const { chromium } = require('playwright');
const URL = 'http://localhost:8081';
const errors = [];
const run = 'f2' + Date.now().toString(36);
async function newUser(browser, label) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-DE' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('realtime')) errors.push(`${label}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${label} PAGEERROR: ${e.message}`));
  await page.addInitScript(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
  return page;
}
const shot = (page, name) => page.screenshot({ path: `${process.env.SHOTS || '/tmp/zz-shots'}/${name}.png`, fullPage: false });
async function signup(page, email) {
  await page.goto(URL);
  // Einführung beim ersten Start überspringen.
  await page.getByText('Überspringen', { exact: true }).click();
  await page.getByPlaceholder('name@beispiel.de').fill(email);
  await page.getByPlaceholder('••••••••').fill('geheim123');
  await page.getByText('Konto erstellen', { exact: true }).click();
  await page.getByText('Eure Familie').waitFor({ timeout: 15000 });
}
const go = async (page, path, waitText) => { await page.goto(URL + path); if (waitText) await page.getByText(waitText).first().waitFor({ timeout: 15000 }); };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const a = await newUser(browser, 'A');
  await signup(a, `a-${run}@example.com`);
  await a.getByPlaceholder('z. B. Sandra').fill('Sandra');
  await a.getByPlaceholder('z. B. Thomas').fill('Thomas');
  await a.getByPlaceholder('z. B. Mia, Paul').fill('Mia');
  await a.getByText('Familie anlegen', { exact: true }).last().click();
  await a.getByText('Hallo Sandra').waitFor({ timeout: 15000 });
  const code = (await a.textContent('body')).match(/verbunden([A-Z]{6})/)[1];
  const b = await newUser(browser, 'B');
  await signup(b, `b-${run}@example.com`);
  await b.getByText('Ich habe einen Code', { exact: true }).click();
  await b.getByPlaceholder('z. B. KMPQXT').fill(code);
  await b.getByText('Verbinden', { exact: true }).click();
  await b.getByText('Hallo Thomas').waitFor({ timeout: 15000 });

  // Entscheidung A, Antwort B
  await go(a, '/decision-new', 'Worum geht es?');
  await a.getByPlaceholder('z. B. Klassenfahrt nach Italien im Mai').fill('Zahnspange für Mia');
  await a.getByText('An Thomas senden').click();
  await a.waitForTimeout(1000);
  await go(b, '/decisions', 'Zahnspange für Mia');
  await b.getByPlaceholder('z. B. Einverstanden, wenn …').fill('Einverstanden, Kosten 50/50');
  await b.getByText('Zustimmen', { exact: true }).click();
  await b.getByText('zugestimmt', { exact: false }).first().waitFor();
  await shot(b, '20-decision-answered');

  // Übergabe A, Antwort B
  await go(a, '/handover-new', 'Wie lief es?');
  await a.getByText('⏰ Verspätet').click();
  await a.getByText('30 Min.').click();
  await a.getByText('Eintragen', { exact: true }).click();
  await a.waitForTimeout(1000);
  await go(b, '/handovers', 'Verspätet');
  await b.getByPlaceholder('z. B. Stau auf der A3, kurz Bescheid gegeben').fill('Stau, hatte Bescheid gegeben');
  await b.getByText('Stimmt nicht', { exact: true }).click();
  await b.getByText('widersprochen', { exact: false }).first().waitFor();
  await shot(b, '21-handover');

  // Kind-Info
  await go(a, '/child-info-edit?category=gesundheit', 'Bereich');
  await a.getByText('Kinderarzt', { exact: true }).click();
  await a.getByPlaceholder('z. B. Dr. Weber, Hauptstr. 5, 0221 123456').fill('Dr. Weber, 0221 123456');
  await a.getByText('Speichern', { exact: true }).click();
  await a.waitForTimeout(1000);
  await go(a, '/child-info', 'Dr. Weber');
  await shot(a, '22-child-info');

  // Vereinbarung A, Zustimmung B
  await go(a, '/agreement', 'Vereinbarung beginnen');
  await a.getByText('Vereinbarung beginnen').click();
  await a.getByPlaceholder(/Wo und wann\?/).fill('Freitags 17 Uhr an der Kita.');
  await a.getByText('Speichern & zustimmen').click();
  await a.getByText('Wartet auf Zustimmung').waitFor();
  await go(b, '/agreement', 'Ich stimme dieser Fassung zu');
  await b.getByText('Ich stimme dieser Fassung zu').click();
  await b.getByText('Von beiden angenommen').waitFor();
  await shot(b, '23-agreement');

  // Fachkraft: A lädt ein, B stimmt zu, Fachkraft liest
  await go(a, '/professionals', 'Wer bekommt Zugang?');
  await a.getByPlaceholder('z. B. Jugendamt Köln, Frau Schmidt').fill('Jugendamt Köln, Frau Schmidt');
  await a.getByText('Code erstellen & teilen').click();
  await a.waitForTimeout(1500);
  await a.reload();
  await a.getByText('Code:', { exact: false }).first().waitFor();
  const pcode = (await a.textContent('body')).match(/Code: ([A-Z0-9]{8})/)[1];
  await shot(a, '24-professionals-a');
  const p = await newUser(browser, 'P');
  await signup(p, `pro-${run}@example.com`);
  await p.getByText('Ich bin Fachkraft', { exact: true }).click();
  await p.getByPlaceholder('8 Zeichen').fill(pcode);
  await p.getByText('Zugang öffnen').click();
  await p.getByText('Fachkraft-Zugang', { exact: true }).waitFor({ timeout: 15000 });
  await p.getByText('Wartet auf Zustimmung', { exact: false }).waitFor();
  await shot(p, '25-pro-waiting');
  await go(b, '/professionals', 'Jugendamt Köln');
  await b.getByText('Zustimmen', { exact: true }).click();
  await b.waitForTimeout(1200);
  await p.reload();
  await p.waitForTimeout(3000);
  await shot(p, '25b-pro-after-approve');
  await p.getByText('Sandra & Thomas', { exact: false }).first().click();
  await p.getByText('Letzte Nachrichten').waitFor({ timeout: 15000 });
  await shot(p, '26-pro-case');
  await p.getByText('Kurzbericht', { exact: true }).click();
  await p.waitForTimeout(1500);
  console.log('printed', await p.evaluate(() => window.__printed || 0));

  // Hilfe & Tagebuch
  await go(a, '/help', 'Sofort Hilfe');
  await shot(a, '27-help');
  await go(a, '/journal-new', 'Was ist passiert?');
  await a.getByPlaceholder(/Übergabe 30 Minuten/).fill('Mia war nach der Übergabe sehr still.');
  await a.getByText('Speichern', { exact: true }).click();
  await a.waitForTimeout(1000);
  await go(a, '/journal', 'sehr still');
  await shot(a, '28-journal');
  // Tausch über Zeitraum
  await go(a, '/change-new', 'Ein Tag');
  await a.getByText('Zeitraum (z. B. Ferien)').click();
  await shot(a, '29-change-range');
  console.log('ERRORS:\n' + errors.join('\n'));
  await browser.close();
})().catch(async (e) => { console.error('FAIL', e.message.slice(0, 600)); console.log('ERRORS:\n' + errors.join('\n')); process.exit(1); });
