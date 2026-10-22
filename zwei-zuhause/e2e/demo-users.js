// Legt die Demo-Familie über die echte Oberfläche an (Sandra legt an, Thomas tritt bei).
const { chromium } = require('playwright');
const URL = 'http://localhost:8081';
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
  const a = await (await browser.newContext()).newPage();
  await signup(a, 'sandra@demo.de');
  await a.getByPlaceholder('z. B. Sandra').fill('Sandra');
  await a.getByPlaceholder('z. B. Thomas').fill('Thomas');
  await a.getByPlaceholder('z. B. Mia, Paul').fill('Mia');
  await a.getByText('Familie anlegen', { exact: true }).last().click();
  await a.getByText('Hallo Sandra').waitFor({ timeout: 15000 });
  const code = (await a.textContent('body')).match(/verbunden([A-Z]{6})/)[1];
  const b = await (await browser.newContext()).newPage();
  await signup(b, 'thomas@demo.de');
  await b.getByText('Ich habe einen Code', { exact: true }).click();
  await b.getByPlaceholder('z. B. KMPQXT').fill(code);
  await b.getByText('Verbinden', { exact: true }).click();
  await b.getByText('Hallo Thomas').waitFor({ timeout: 15000 });
  await browser.close();
  console.log('ok');
})().catch((e) => { console.error(e.message); process.exit(1); });
