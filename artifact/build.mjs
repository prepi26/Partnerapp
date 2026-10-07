// Baut die App als eine einzige HTML-Datei für ein Claude-Artefakt.
// Aufruf: node artifact/build.mjs <ausgabe.html>
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] ?? 'wir-zwei-artefakt.html');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'wir-zwei-artefakt-'));

// Projekt kopieren und die Server-Anbindung gegen die Artefakt-Datenbank tauschen.
for (const entry of fs.readdirSync(root)) {
  if (['node_modules', '.git', 'dist', '.expo'].includes(entry)) continue;
  fs.cpSync(path.join(root, entry), path.join(work, entry), { recursive: true });
}
fs.symlinkSync(path.join(root, 'node_modules'), path.join(work, 'node_modules'));
fs.copyFileSync(path.join(root, 'artifact/claudeDbClient.ts'), path.join(work, 'src/lib/supabase.ts'));

// --clear: Metro cacht die Routenliste pfadabhängig; ohne frischen Cache fehlen sonst die Screens.
execSync('npx expo export --platform web --output-dir dist --clear', {
  cwd: work,
  stdio: 'inherit',
  // Platzhalter: im Artefakt wird kein Supabase-Server benutzt.
  env: {
    ...process.env,
    EXPO_PUBLIC_SUPABASE_URL: 'https://artefakt.local',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'artefakt-ohne-server-key',
  },
});

const dist = path.join(work, 'dist');
const jsDir = path.join(dist, '_expo/static/js/web');
let js = fs.readFileSync(
  path.join(
    jsDir,
    fs.readdirSync(jsDir).find((f) => f.endsWith('.js')),
  ),
  'utf8',
);

// Bilder und Icon-Schrift einbetten – das Artefakt lädt nichts von fremden Adressen.
const mime = { '.png': 'image/png', '.ttf': 'font/ttf' };
js = js.replace(/"(\/assets\/[^"]+)"/g, (match, p) => {
  const file = path.join(dist, decodeURIComponent(p));
  if (!fs.existsSync(file)) return match;
  return JSON.stringify(`data:${mime[path.extname(file)]};base64,${fs.readFileSync(file).toString('base64')}`);
});
js = js.replace(/<\/script/gi, '<\\/script');

const html = `<title>Wir zwei</title>
<style>
  :root { --bg: #FFF5FA; color-scheme: light; }
  html, body { height: 100%; }
  body { overflow: hidden; background: var(--bg); }
  #root { display: flex; height: 100%; flex: 1; }
</style>
<div id="root"></div>
<script>
  // Die App startet immer auf dem Startbildschirm, egal unter welchem Pfad das Artefakt läuft.
  try { history.replaceState(null, '', '/'); } catch (e) {}
</script>
<script>${js}</script>
`;
fs.writeFileSync(out, html);
fs.rmSync(work, { recursive: true, force: true });
console.log(`Artefakt geschrieben: ${out} (${(html.length / 1e6).toFixed(2)} MB)`);
