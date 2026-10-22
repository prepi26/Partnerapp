/**
 * Prüft eine Übersetzung gegen Deutsch: gleiche Schlüssel, gleiche Listenlängen, gleiche Platzhalter.
 *   npx tsx --tsconfig tsconfig.json scripts/check-i18n.ts en
 */
import { de } from '../src/i18n/de';

const code = process.argv[2];
const problems: string[] = [];
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');

function walk(a: unknown, b: unknown, path: string) {
  if (typeof a === 'string') {
    if (typeof b !== 'string') return problems.push(`${path}: fehlt`);
    if (placeholders(a) !== placeholders(b)) problems.push(`${path}: Platzhalter ${placeholders(a)} ≠ ${placeholders(b)}`);
    if (a.trim() && !b.trim()) problems.push(`${path}: leer`);
    return;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || b.length !== a.length) return problems.push(`${path}: Liste mit ${a.length} Einträgen erwartet`);
    a.forEach((x, i) => walk(x, b[i], `${path}[${i}]`));
    return;
  }
  if (a && typeof a === 'object') {
    for (const k of Object.keys(a)) walk((a as Record<string, unknown>)[k], (b as Record<string, unknown>)?.[k], `${path}.${k}`);
  }
}

(async () => {
  const mod = await import(`../src/i18n/${code}/index`);
  walk(de, mod[code], code);
  if (problems.length) {
    console.log(problems.join('\n'));
    process.exit(1);
  }
  console.log('OK');
})();
