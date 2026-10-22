// Allein starten, Unterhalt, Packliste, Schulferien, Kalender-Abo – gegen das lokale Supabase (siehe local-stack.sh).
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
  await page.getByText('Überspringen', { exact: true }).click();
  await page.getByPlaceholder('name@beispiel.de').fill(email);
  await page.getByPlaceholder('••••••••').fill('geheim123');
  await page.getByText('Konto erstellen', { exact: true }).click();
  await page.getByText('Eure Familie').waitFor({ timeout: 15000 });
}
async function open(page, path, text) {
  await page.goto(URL + path);
  await page.getByText(text).first().waitFor({ timeout: 15000 });
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const a = await newParent(browser, 'A');
  await signup(a, `anna-${run}@example.com`);
  await a.getByPlaceholder('z. B. Sandra').fill('Anna');
  await a.getByPlaceholder('z. B. Thomas').fill('Ben');
  await a.getByPlaceholder('z. B. Mia, Paul').fill('Mia');
  await a.getByText('Familie anlegen', { exact: true }).last().click();
  await a.getByText('Hallo Anna').waitFor({ timeout: 15000 });
  await a.getByText('Die 14 kostenlosen Testtage starten erst, wenn Ben dabei ist.').waitFor();
  console.log('solo hint shown');
  const code = (await a.textContent('body')).match(/verbunden([A-Z]{6})/)?.[1];

  // Unterhalt festlegen (allein)
  await open(a, '/maintenance', 'Noch kein Betrag festgelegt');
  await a.getByText('Betrag festlegen', { exact: true }).click();
  await a.getByText('Ben', { exact: true }).click();
  await a.getByPlaceholder('0,00').fill('400');
  await a.getByPlaceholder(/Jugendamtsurkunde/).fill('Jugendamtsurkunde');
  await a.getByText('Speichern', { exact: true }).click();
  await a.getByText('400,00 € im Monat · zahlt Ben').waitFor({ timeout: 10000 });
  console.log('maintenance terms saved');

  // Ben tritt bei und trägt seine Zahlung ein
  const b = await newParent(browser, 'B');
  await signup(b, `ben-${run}@example.com`);
  await b.getByText('Ich habe einen Code', { exact: true }).click();
  await b.getByPlaceholder('z. B. KMPQXT').fill(code);
  await b.getByText('Verbinden', { exact: true }).click();
  await b.getByText('Hallo Ben').waitFor({ timeout: 15000 });
  await open(b, '/maintenance', '400,00 € im Monat · zahlst du');
  await b.getByLabel('Zahlung eintragen').click();
  await b.getByText('Anna bestätigt, ob das Geld angekommen ist.').waitFor();
  await b.getByText('Eintragen', { exact: true }).click();
  await b.getByText('wartet auf Bestätigung').waitFor({ timeout: 10000 });
  console.log('payment entered by payer');

  // Anna bestätigt den Erhalt
  await open(a, '/maintenance', 'Zahlungen');
  await a.getByText('Erhalten', { exact: true }).click();
  await a.getByText('bezahlt', { exact: true }).waitFor({ timeout: 10000 });
  await shot(a, 'x1-maintenance');
  console.log('payment confirmed, month paid');

  // Packliste
  await open(a, '/packing', 'Immer mit');
  await a.getByPlaceholder('Was muss mit?').fill('Asthmaspray');
  await a.getByText('↻ immer', { exact: true }).click();
  await a.getByText('Hinzufügen', { exact: true }).click();
  await a.getByText('Asthmaspray', { exact: true }).waitFor();
  await a.getByPlaceholder('Was muss mit?').fill('Schwimmsachen');
  await a.getByText('↻ immer', { exact: true }).click();
  await a.getByText('Hinzufügen', { exact: true }).click();
  await a.getByText('Schwimmsachen', { exact: true }).waitFor();
  await a.getByRole('checkbox', { name: 'Schwimmsachen' }).click();
  await a.getByText('Wo liegt es?').first().click();
  await a.getByText('liegt bei dir').waitFor();
  await shot(a, 'x2-packing');
  await open(b, '/packing', 'Asthmaspray');
  const packed = await b.getByRole('checkbox', { name: 'Schwimmsachen' }).getAttribute('aria-checked');
  console.log('B sees packing list, Schwimmsachen packed:', packed);
  await b.getByText('Übergabe erledigt – Liste zurücksetzen').click();
  await b.getByText('Übergabe erledigt – Liste zurücksetzen').last().click();
  await b.waitForTimeout(1500);
  console.log('after reset, Schwimmsachen gone:', !(await b.getByText('Schwimmsachen', { exact: true }).count()));

  // Schulferien
  await open(a, '/holidays', 'Wo geht das Kind zur Schule?');
  await a.getByText('Nordrhein-Westfalen', { exact: true }).click();
  await a.getByText('Die nächsten Ferien').waitFor({ timeout: 10000 });
  await a.getByText('Weihnachtsferien').first().waitFor();
  await shot(a, 'x3-holidays');
  await a.getByText('Aufteilung vorschlagen').first().click();
  await a.getByText('Zeitraum (z. B. Ferien)').waitFor();
  // Weihnachtsferien NRW 2026/27: 23.12.–6.1. = 15 Tage
  await a.getByText('15 Tage', { exact: true }).waitFor();
  await shot(a, 'x5-holiday-proposal');
  console.log('holiday range prefilled');
  await open(a, '/calendar', '🏖 Schulferien: Nordrhein-Westfalen');
  console.log('calendar shows holiday region');

  // Kalender-Abo: Link wird erzeugt (Teilen gibt es im Test-Browser nicht)
  await open(a, '/calendar-sync', 'Kalender abonnieren');
  await shot(a, 'x4-calendar-sync');

  console.log('ERRORS:', errors.join('\n'));
  await browser.close();
})().catch((e) => {
  console.log('FAIL', e.message, '\nERRORS:', errors.join('\n'));
  process.exit(1);
});
