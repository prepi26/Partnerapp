/**
 * Schreibt die Mitteilungstexte aller Sprachen (t.lib.push) in supabase/schema.sql zwischen die Marken
 * PUSH_TEXTS_BEGIN und PUSH_TEXTS_END. Aufruf nach jeder Änderung an den Übersetzungen:
 *   npx tsx --tsconfig tsconfig.json scripts/push-texts.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DICTS } from '../src/i18n/dicts';

const file = join(__dirname, '..', 'supabase', 'schema.sql');
const sql = (text: string) => `'${text.replace(/'/g, "''")}'`;

const rows: string[] = [];
for (const [lang, dict] of Object.entries(DICTS)) {
  for (const [key, text] of Object.entries(dict.lib.push)) rows.push(`  (${sql(lang)}, ${sql(key)}, ${sql(text)})`);
}

const block = [
  '-- PUSH_TEXTS_BEGIN (erzeugt mit: npx tsx scripts/push-texts.ts – nicht von Hand ändern)',
  'insert into public.push_texts (lang, key, text) values',
  rows.join(',\n'),
  'on conflict (lang, key) do update set text = excluded.text;',
  '-- PUSH_TEXTS_END',
].join('\n');

const schema = readFileSync(file, 'utf8');
const updated = schema.replace(/-- PUSH_TEXTS_BEGIN[\s\S]*?-- PUSH_TEXTS_END/, block);
if (updated === schema && !schema.includes(block)) throw new Error('Marken in schema.sql nicht gefunden');
writeFileSync(file, updated);
console.log(`${rows.length} Mitteilungstexte geschrieben.`);
