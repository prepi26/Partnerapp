// Gutscheincode einlösen und Fachkraft-Einstieg im Browser (…/?fachkraft) – gegen das lokale Supabase.
const { chromium } = require('playwright');
const { execSync } = require('node:child_process');
const URL = 'http://localhost:8081';
const errors = [];
const run = Date.now().toString(36);
const code = `JA-${run.toUpperCase().slice(-6)}`;
async function newPage(browser, label, viewport = { width: 390, height: 844 }) {
  const ctx = await browser.newContext({ viewport, locale: 'de-DE' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('realtime')) errors.push(`${label}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${label} PAGEERROR: ${e.message}`));
  return page;
}
const shot = (page, name) => page.screenshot({ path: `${process.env.SHOTS || '/tmp/zz-shots'}/${name}.png` });
(async () => {
  // Code anlegen – wie du es im Supabase SQL Editor machst.
  execSync(`docker exec -e PGPASSWORD=pw zzdb psql -h localhost -U postgres -d postgres -qc "insert into promo_codes (code, label, days) values ('${code}', 'Test-Jugendamt', 90)"`);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });

  const a = await newPage(browser, 'A');
  await a.goto(URL);
  await a.getByText('Überspringen', { exact: true }).click();
  await a.getByPlaceholder('name@beispiel.de').fill(`gina-${run}@example.com`);
  await a.getByPlaceholder('••••••••').fill('geheim123');
  await a.getByText('Konto erstellen', { exact: true }).click();
  await a.getByText('Eure Familie').waitFor({ timeout: 15000 });
  await a.getByPlaceholder('z. B. Sandra').fill('Gina');
  await a.getByPlaceholder('z. B. Thomas').fill('Hans');
  await a.getByText('Familie anlegen', { exact: true }).last().click();
  await a.getByText('Hallo Gina').waitFor({ timeout: 15000 });

  await a.goto(URL + '/plus');
  await a.getByText('Gutscheincode', { exact: true }).waitFor({ timeout: 15000 });
  await a.getByPlaceholder('z. B. JA-AACHEN').fill('FALSCH1');
  await a.getByText('Einlösen', { exact: true }).click();
  await a.getByText('Dieser Code passt nicht oder wurde schon benutzt.').waitFor();
  console.log('wrong code rejected');
  await a.getByText('OK', { exact: true }).click().catch(() => {});
  await a.getByPlaceholder('z. B. JA-AACHEN').fill(code.toLowerCase());
  await a.getByText('Einlösen', { exact: true }).click();
  await a.getByText('Gutschein eingelöst ✓').waitFor({ timeout: 10000 });
  await a.getByText('OK', { exact: true }).click().catch(() => {});
  await a.getByText(/^Gutschein: kostenlos bis /).first().waitFor();
  console.log('promo redeemed:', await a.getByText(/^Gutschein: kostenlos bis /).first().textContent());
  await shot(a, 'p1-plus-promo');

  // Fachkraft am PC über den Link
  const pro = await newPage(browser, 'PRO', { width: 1400, height: 900 });
  await pro.goto(URL + '/?fachkraft');
  await pro.getByText(/Zugang für Fachkräfte/).waitFor({ timeout: 15000 });
  console.log('intro skipped:', !(await pro.getByText('Überspringen', { exact: true }).count()));
  await pro.getByPlaceholder('name@beispiel.de').fill(`fk-${run}@example.com`);
  await pro.getByPlaceholder('••••••••').fill('geheim123');
  await pro.getByText('Konto erstellen', { exact: true }).click();
  await pro.getByText('Code der Familie').waitFor({ timeout: 15000 });
  console.log('onboarding opens professional mode');
  const width = await pro.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find((d) => d.getBoundingClientRect().width > 0 && getComputedStyle(d).maxWidth === '820px');
    return el ? el.getBoundingClientRect().width : null;
  });
  console.log('app width on desktop:', width);
  await shot(pro, 'p2-pro-desktop');

  console.log('ERRORS:', errors.join('\n'));
  await browser.close();
})().catch((e) => {
  console.log('FAIL', e.message, '\nERRORS:', errors.join('\n'));
  process.exit(1);
});
