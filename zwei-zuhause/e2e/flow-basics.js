const { chromium } = require('playwright');
const URL = 'http://localhost:8081';
const errors = [];
const run = Date.now().toString(36);
async function newParent(browser, label) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-DE' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('realtime')) errors.push(`${label}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${label} PAGEERROR: ${e.message}`));
  return page;
}
const shot = (page, name) => page.screenshot({ path: `${process.env.SHOTS || '/tmp/zz-shots'}/${name}.png` });
async function signup(page, email) {
  await page.goto(URL);
  // Einführung beim ersten Start überspringen.
  await page.getByText('Überspringen', { exact: true }).click();
  await page.getByPlaceholder('name@beispiel.de').fill(email);
  await page.getByPlaceholder('••••••••').fill('geheim123');
  await page.getByText('Konto erstellen', { exact: true }).click();
  await page.getByText('Eure Familie').waitFor({ timeout: 15000 });
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const a = await newParent(browser, 'A');
  await signup(a, `sandra-${run}@example.com`);
  await shot(a, '01-onboarding');
  await a.getByPlaceholder('z. B. Sandra').fill('Sandra');
  await a.getByPlaceholder('z. B. Thomas').fill('Thomas');
  await a.getByPlaceholder('z. B. Mia, Paul').fill('Mia');
  await a.getByText('Familie anlegen', { exact: true }).last().click();
  await a.getByText('Hallo Sandra').waitFor({ timeout: 15000 });
  await shot(a, '02-home-a');
  const body = await a.textContent('body');
  const code = body.match(/verbunden([A-Z]{6})/)?.[1] || body.match(/\b([A-HJ-NP-Z]{6})\b/)?.[1];
  console.log('code', code);

  const b = await newParent(browser, 'B');
  await signup(b, `thomas-${run}@example.com`);
  await b.getByText('Ich habe einen Code', { exact: true }).click();
  await b.getByPlaceholder('z. B. KMPQXT').fill(code);
  await b.getByText('Verbinden', { exact: true }).click();
  await b.getByText('Hallo Thomas').waitFor({ timeout: 15000 });
  await shot(b, '03-home-b');

  // Umgangsplan
  await a.reload(); await a.getByText('Hallo Sandra').waitFor();
  await a.getByText('Umgangsplan festlegen →').click();
  await a.getByText('Wechselmodell 7/7').click();
  await a.getByText('17:00', { exact: true }).click();
  await a.getByPlaceholder(/Kita Sonnenschein/).fill('Kita Sonnenschein');
  await a.getByText('Plan speichern').click();
  await a.getByText('Hallo Sandra').waitFor();
  await a.getByText(/17:00 Uhr · Kita Sonnenschein/).first().waitFor({ timeout: 10000 });
  console.log('handover time and place shown on home');
  await shot(a, '04-home-plan');
  await a.getByRole('tab', { name: /Kalender/ }).click();
  await a.waitForTimeout(800);
  await shot(a, '05-calendar');

  // Nachricht B -> A (mit Ton-Check-freiem Text)
  await b.getByRole('tab', { name: /Nachrichten/ }).click();
  await b.getByPlaceholder('Nachricht schreiben…').fill('Hallo Sandra, kann ich Mia am Freitag um 17 Uhr abholen?');
  await b.getByLabel('Senden').click();
  await b.waitForTimeout(1500);
  await shot(b, '06-messages-b');

  // Ausgabe A
  await a.getByRole('tab', { name: /Kosten/ }).click();
  await a.getByLabel('Neue Ausgabe').click();
  await a.getByPlaceholder('0,00').fill('80');
  await a.getByPlaceholder('z. B. Winterjacke').fill('Winterjacke');
  await a.getByText('Speichern', { exact: true }).click();
  await a.waitForTimeout(1500);
  await shot(a, '07-expenses-a');

  // B bestätigt
  // Ohne lokalen Realtime-Dienst: neu laden statt Live-Update.
  await b.reload(); await b.getByRole('tab', { name: /Kosten/ }).waitFor();
  await b.getByRole('tab', { name: /Kosten/ }).click();
  await b.waitForTimeout(500);
  
  await b.getByText('Winterjacke').click();
  await b.getByText('Bestätigen', { exact: true }).click();
  await b.waitForTimeout(1200);
  await shot(b, '08-expense-confirmed-b');

  // Entscheidung A -> B
  await a.getByRole('tab', { name: /Mehr/ }).click();
  await shot(a, '09-more');
  await a.getByRole('button', { name: /Entscheidungen Schule/ }).click();
  await a.getByLabel('Neue Frage').click();
  await a.getByPlaceholder('z. B. Klassenfahrt nach Italien im Mai').fill('Klassenfahrt nach Italien im Mai');
  await a.getByText('An Thomas senden').click();
  await a.waitForTimeout(1200);
  await shot(a, '10-decisions-a');

  // A liest Nachricht
  await a.goto(URL + '/messages');
  await a.waitForTimeout(2000);
  await shot(a, '11-messages-a');

  console.log('ERRORS:\n' + errors.join('\n'));
  await browser.close();
})().catch(async (e) => { console.error('FAIL', e.message); console.log('ERRORS:\n' + errors.join('\n')); process.exit(1); });
