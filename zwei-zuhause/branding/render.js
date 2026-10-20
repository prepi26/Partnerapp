// Rendert SVGs in PNG-Größen für App-Icon, Android, Splash und Favicon.
const { chromium } = require('playwright');
const fs = require('fs');
const dir = process.argv[2], out = process.argv[3];
const jobs = [
  ['logo-1-zwei-haeuser.svg', 'icon.png', 1024, 1024],
  ['logo-1-zwei-haeuser.svg', 'favicon.png', 48, 48],
  ['logo-1-zwei-haeuser.svg', 'preview-logo-1.png', 512, 512],
  ['logo-2-bruecke.svg', 'preview-logo-2.png', 512, 512],
  ['logo-3-zwei-haelften.svg', 'preview-logo-3.png', 512, 512],
  ['wortmarke.svg', 'preview-wortmarke.png', 1200, 300],
  ['android-foreground.svg', 'android-icon-foreground.png', 1024, 1024],
  ['android-monochrome.svg', 'android-icon-monochrome.png', 1024, 1024],
  ['android-background.svg', 'android-icon-background.png', 1024, 1024],
  ['splash.svg', 'splash-icon.png', 1024, 1024],
];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--disable-gpu'] });
  const p = await b.newPage();
  for (const [src, dst, w, h] of jobs) {
    const svg = fs.readFileSync(`${dir}/${src}`, 'utf8');
    await p.setViewportSize({ width: Math.max(w, 400), height: Math.max(h, 400) });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${w}" height="${h}" `)}</body></html>`);
    await p.locator('svg').screenshot({ path: `${out}/${dst}`, omitBackground: true, timeout: 60000 });
  }
  await b.close();
})();
