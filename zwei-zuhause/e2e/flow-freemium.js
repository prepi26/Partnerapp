// Kostenlose Grundversion nach der Testzeit und eigener Umgangsrhythmus – gegen das lokale Supabase.
const { chromium } = require('playwright');
const { execSync } = require('node:child_process');
const URL = 'http://localhost:8081';
const errors = [];
const run = Date.now().toString(36);
const sql = (q) => execSync(`docker exec -e PGPASSWORD=pw zzdb psql -h localhost -U postgres -d postgres -tAc "${q}"`).toString().trim();
async function newParent(browser, label) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-DE' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('realtime') && !m.text().includes('403')) errors.push(`${label}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${label} PAGEERROR: ${e.message}`));
  return page;
}
const shot = (page, name) => page.screenshot({ path: `${process.env.SHOTS || '/tmp/zz-shots'}/${name}.png` });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const a = await newParent(browser, 'A');
  await a.goto(URL);
  await a.getByText('Überspringen', { exact: true }).click();
  await a.getByPlaceholder('name@beispiel.de').fill(`frei-${run}@example.com`);
  await a.getByPlaceholder('••••••••').fill('geheim123');
  await a.getByText('Konto erstellen', { exact: true }).click();
  await a.getByText('Eure Familie').waitFor({ timeout: 15000 });
  await a.getByPlaceholder('z. B. Sandra').fill('Nina');
  await a.getByPlaceholder('z. B. Thomas').fill('Omar');
  await a.getByPlaceholder('z. B. Mia, Paul').fill('Lina');
  await a.getByText('Familie anlegen', { exact: true }).last().click();
  await a.getByText('Hallo Nina').waitFor({ timeout: 15000 });

  // Eigener Rhythmus: 2 Wochen, ab Montag
  await a.goto(URL + '/schedule');
  await a.getByText('Eigener Rhythmus', { exact: true }).click();
  await a.getByText('Rhythmus über').waitFor();
  await a.getByText('2 Wochen', { exact: true }).click();
  await a.getByLabel(/^Mi \d+: Nina$/).first().click();
  await shot(a, 'f1-custom-rhythm');
  await a.getByText('Plan speichern').click();
  await a.getByText('Hallo Nina').waitFor({ timeout: 15000 });
  const pattern = sql(`select schedule_model || ' ' || schedule_pattern from families where name_a = 'Nina' and parent_a = (select id from auth.users where email = 'frei-${run}@example.com')`);
  console.log('saved rhythm:', pattern);

  // Testzeit vorbei (allein 31 Tage)
  sql(`update families set created_at = now() - interval '31 days' where parent_a = (select id from auth.users where email = 'frei-${run}@example.com')`);
  await a.reload();
  await a.getByText('Hallo Nina').waitFor({ timeout: 15000 });
  await a.getByText('Kostenlose Version · Plus für Kosten, Unterhalt und Berichte').waitFor();
  console.log('free banner shown');
  await shot(a, 'f2-home-free');

  // Grundversion: Packliste geht
  await a.goto(URL + '/packing');
  await a.getByPlaceholder('Was muss mit?').fill('Brotdose');
  await a.getByText('Hinzufügen', { exact: true }).click();
  await a.getByText('Brotdose', { exact: true }).waitFor({ timeout: 10000 });
  console.log('packing works without Plus');

  // Plus-Bereich: Ausgabe zeigt die Erklärung statt des Formulars
  await a.goto(URL + '/expense-new');
  await a.getByText('✨ Plus-Funktion').waitFor({ timeout: 15000 });
  console.log('expense form gated:', !(await a.getByPlaceholder('z. B. Winterjacke').count()));
  await shot(a, 'f3-plus-gate');

  console.log('ERRORS:', errors.join('\n'));
  await browser.close();
})().catch((e) => {
  console.log('FAIL', e.message, '\nERRORS:', errors.join('\n'));
  process.exit(1);
});
