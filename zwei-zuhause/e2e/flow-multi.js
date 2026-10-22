// Mehrere Familien: Sandra hat Mia mit Thomas und Leo mit Markus. Prüft Wechsler, Übersicht und strikte Trennung.
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
async function createFamily(page, me, other, kids) {
  await page.getByPlaceholder('z. B. Sandra').fill(me);
  await page.getByPlaceholder('z. B. Thomas').fill(other);
  await page.getByPlaceholder('z. B. Mia, Paul').fill(kids);
  await page.getByText('Familie anlegen', { exact: true }).last().click();
}
async function join(page, code) {
  await page.getByText('Ich habe einen Code', { exact: true }).click();
  await page.getByPlaceholder('z. B. KMPQXT').fill(code);
  await page.getByText('Verbinden', { exact: true }).click();
}
const codeOf = async (page) => (await page.textContent('body')).match(/verbunden([A-Z]{6})/)?.[1];
async function messagesText(page) {
  await page.goto(URL + '/messages');
  await page.getByPlaceholder('Nachricht schreiben…').waitFor({ timeout: 15000 });
  await page.waitForTimeout(800);
  return page.textContent('body');
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const s = await newParent(browser, 'Sandra');
  await signup(s, `sandra-${run}@example.com`);
  await createFamily(s, 'Sandra', 'Thomas', 'Mia');
  await s.getByText('Hallo Sandra').waitFor({ timeout: 15000 });
  const code1 = await codeOf(s);

  const t = await newParent(browser, 'Thomas');
  await signup(t, `thomas-${run}@example.com`);
  await join(t, code1);
  await t.getByText('Hallo Thomas').waitFor({ timeout: 15000 });

  // Zweite Familie über „Familie hinzufügen“
  await s.goto(URL + '/family-new');
  await s.getByText(/eigene Familie an/).waitFor({ timeout: 15000 });
  await createFamily(s, 'Sandra', 'Markus', 'Leo');
  await s.goto(URL);
  await s.getByText('Leo · mit Markus').waitFor({ timeout: 15000 });
  console.log('second family created and opened');
  const code2 = await codeOf(s);

  const m = await newParent(browser, 'Markus');
  await signup(m, `markus-${run}@example.com`);
  await join(m, code2);
  await m.getByText('Hallo Markus').waitFor({ timeout: 15000 });

  // Übersicht über die andere Familie
  await s.reload();
  await s.getByText('Alle Kinder heute').waitFor({ timeout: 15000 });
  await s.getByText('Mia · mit Thomas').last().waitFor();
  await shot(s, 'm1-home-two-families');
  console.log('overview shows other family');

  // Nachricht in Familie 2
  await s.goto(URL + '/messages');
  await s.getByPlaceholder('Nachricht schreiben…').fill('Hallo Markus, Leo braucht neue Schuhe.');
  await s.getByLabel('Senden').click();
  await s.getByText('Hallo Markus, Leo braucht neue Schuhe.').waitFor({ timeout: 10000 });

  // Wechsel zu Familie 1: Nachricht darf dort nicht stehen
  await s.goto(URL);
  await s.getByText('Leo · mit Markus').first().click();
  await s.getByText('Mia · mit Thomas').last().click();
  await s.getByText('Mia · mit Thomas').first().waitFor();
  await s.waitForTimeout(1000);
  const sandraF1 = await messagesText(s);
  console.log('family 1 free of family 2 message:', !sandraF1.includes('Leo braucht'));
  await s.getByPlaceholder('Nachricht schreiben…').fill('Hallo Thomas, Mia hat Schwimmkurs.');
  await s.getByLabel('Senden').click();
  await s.getByText('Hallo Thomas, Mia hat Schwimmkurs.').waitFor({ timeout: 10000 });
  await shot(s, 'm2-messages-family1');

  const thomasMsgs = await messagesText(t);
  const markusMsgs = await messagesText(m);
  console.log('Thomas sees only his:', thomasMsgs.includes('Schwimmkurs') && !thomasMsgs.includes('Leo') && !thomasMsgs.includes('Markus'));
  console.log('Markus sees only his:', markusMsgs.includes('Leo braucht') && !markusMsgs.includes('Schwimmkurs') && !markusMsgs.includes('Thomas'));
  const thomasHome = (await t.goto(URL), await t.getByText('Hallo Thomas').waitFor(), await t.textContent('body'));
  console.log('Thomas has no switcher/overview:', !thomasHome.includes('Alle Kinder heute') && !thomasHome.includes('Markus'));

  // Ausgabe für beide Kinder: 600 € auf zwei Familien aufgeteilt
  await s.goto(URL + '/expense-new');
  await s.getByPlaceholder('0,00').fill('600');
  await s.getByPlaceholder('z. B. Winterjacke').fill('Urlaub Ostsee');
  await s.getByText('Leo · mit Markus', { exact: true }).click();
  await s.getByText(/je 300,00 €/).waitFor();
  await s.getByText('Speichern', { exact: true }).click();
  await s.waitForTimeout(1500);
  await m.goto(URL + '/expenses');
  await m.getByText(/Urlaub Ostsee – Anteil/).waitFor({ timeout: 15000 });
  const markusCosts = await m.textContent('body');
  await t.goto(URL + '/expenses');
  await t.getByText(/Urlaub Ostsee – Anteil/).waitFor({ timeout: 15000 });
  const thomasCosts = await t.textContent('body');
  console.log('split expense 300/300:', markusCosts.includes('300,00') && thomasCosts.includes('300,00') && !thomasCosts.includes('600,00') && !thomasCosts.includes('Markus'));
  await shot(m, 'm3-markus-costs');

  console.log('ERRORS:', errors.join('\n'));
  await browser.close();
})().catch((e) => {
  console.log('FAIL', e.message, '\nERRORS:', errors.join('\n'));
  process.exit(1);
});
