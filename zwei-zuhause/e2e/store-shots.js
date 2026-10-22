const { chromium } = require('playwright');
const URL = 'http://localhost:8081';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, locale: 'de-DE' });
  const p = await ctx.newPage();
  await p.goto(URL);
  await p.getByText('Überspringen', { exact: true }).click();
  await p.getByText('Ich habe ein Konto', { exact: true }).click();
  await p.getByPlaceholder('name@beispiel.de').fill('sandra@demo.de');
  await p.getByPlaceholder('••••••••').fill('geheim123');
  await p.getByText('Anmelden', { exact: true }).click();
  await p.getByText('Hallo Sandra').waitFor({ timeout: 15000 });
  const shots = [
    ['/', '1-heute'],
    ['/calendar', '2-kalender'],
    ['/expenses', '3-kosten'],
    ['/messages', '4-nachrichten'],
    ['/decisions', '5-entscheidungen'],
    ['/agreement', '6-vereinbarung'],
    ['/handovers', '7-uebergaben'],
    ['/more', '8-mehr'],
  ];
  for (const [path, name] of shots) {
    await p.goto(URL + path);
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `${process.env.OUT || 'store/raw'}/${name}.png` });
  }
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
