// Einführung, Dokument hochladen (PDF + Gesundheit mit Einwilligung), Sichtbarkeit beim anderen Elternteil, Datenexport.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');
const URL = 'http://localhost:8081';
const errors = [];
const run = 'd' + Date.now().toString(36);
const SHOTS = process.env.SHOTS || '/tmp/zz-shots';
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png` });
async function newUser(browser, label) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-DE', acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('realtime')) errors.push(`${label}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${label} PAGEERROR: ${e.message}`));
  return page;
}
async function signup(page, email, intro) {
  await page.goto(URL);
  if (intro) {
    for (let i = 0; i < 3; i++) {
      await shot(page, `40-intro-${i + 1}`);
      await page.getByText('Weiter', { exact: true }).click();
    }
    await shot(page, '40-intro-4');
    await page.getByText('Los geht’s', { exact: true }).click();
  } else {
    await page.getByText('Überspringen', { exact: true }).click();
  }
  await page.getByPlaceholder('name@beispiel.de').fill(email);
  await page.getByPlaceholder('••••••••').fill('geheim123');
  await page.getByText('Konto erstellen', { exact: true }).click();
  await page.getByText('Eure Familie').waitFor({ timeout: 15000 });
}
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zzdoc-'));
  const pdf = path.join(tmp, 'Zeugnis 2b.pdf');
  fs.writeFileSync(pdf, '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const a = await newUser(browser, 'A');
  await signup(a, `a-${run}@example.com`, true);
  await a.getByPlaceholder('z. B. Sandra').fill('Sandra');
  await a.getByPlaceholder('z. B. Thomas').fill('Thomas');
  await a.getByPlaceholder('z. B. Mia, Paul').fill('Mia');
  await a.getByText('Familie anlegen', { exact: true }).last().click();
  await a.getByText('Hallo Sandra').waitFor({ timeout: 15000 });
  const code = (await a.textContent('body')).match(/verbunden([A-Z]{6})/)[1];
  const b = await newUser(browser, 'B');
  await signup(b, `b-${run}@example.com`, false);
  await b.getByText('Ich habe einen Code', { exact: true }).click();
  await b.getByPlaceholder('z. B. KMPQXT').fill(code);
  await b.getByText('Verbinden', { exact: true }).click();
  await b.getByText('Hallo Thomas').waitFor({ timeout: 15000 });

  // Schuldokument als PDF
  await a.goto(URL + '/document-new');
  const [chooser] = await Promise.all([a.waitForEvent('filechooser'), a.getByText('PDF / Datei', { exact: true }).click()]);
  await chooser.setFiles(pdf);
  await a.getByText('Zeugnis 2b.pdf').waitFor();
  await a.getByText('Teilen', { exact: true }).click();
  await a.waitForTimeout(1500);

  // Gesundheitsdokument: ohne Einwilligung gesperrt
  await a.goto(URL + '/document-new');
  const [chooser2] = await Promise.all([a.waitForEvent('filechooser'), a.getByText('PDF / Datei', { exact: true }).click()]);
  await chooser2.setFiles(pdf);
  await a.getByPlaceholder('z. B. Zeugnis 2. Klasse').fill('Impfpass Mia');
  await a.getByText('🩺 Gesundheit', { exact: true }).click();
  await shot(a, '41-document-health-consent');
  const shareButton = a.getByRole('button', { name: /Teilen/ });
  console.log('share disabled without consent:', await shareButton.getAttribute('aria-disabled'));
  await a.getByRole('switch').click();
  console.log('share disabled with consent:', await shareButton.getAttribute('aria-disabled'));
  await a.getByText('Teilen', { exact: true }).click();
  await a.waitForTimeout(1500);

  // B sieht beide
  await b.goto(URL + '/documents');
  await b.getByText('Impfpass Mia').waitFor({ timeout: 15000 });
  await b.getByText('Zeugnis 2b').waitFor();
  await shot(b, '42-documents-b');
  console.log('B sees both documents');

  // Datenexport
  await a.goto(URL + '/account');
  await a.getByText('Daten exportieren', { exact: true }).waitFor();
  await shot(a, '43-account');
  const [download] = await Promise.all([a.waitForEvent('download'), a.getByText('Daten exportieren', { exact: true }).click()]);
  const file = path.join(tmp, download.suggestedFilename());
  await download.saveAs(file);
  const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log('export', download.suggestedFilename(), 'dokumente:', exported.dokumente.length, 'invite code leaked:', JSON.stringify(exported).includes(code));

  console.log('ERRORS:\n' + errors.join('\n'));
  await browser.close();
})().catch((e) => { console.error('FAIL', e.message.slice(0, 500)); console.log('ERRORS:\n' + errors.join('\n')); process.exit(1); });
