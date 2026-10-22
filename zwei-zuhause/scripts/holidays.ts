/**
 * Erzeugt src/data/holidays.ts aus den offenen Ferienterminen von OpenHolidays (Lizenz ODbL 1.0,
 * https://github.com/openpotato/openholidaysapi.data). Einmal im Jahr neu ausführen:
 *   git clone --depth 1 https://github.com/openpotato/openholidaysapi.data /tmp/oh
 *   npx tsx scripts/holidays.ts /tmp/oh
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FROM = '2025-08-01';
const TO = '2028-12-31';

const root = process.argv[2];
if (!root) throw new Error('Pfad zum geklonten openholidaysapi.data fehlt');

/** Ferienart aus dem deutschen Namen – die App übersetzt sie (t.calendar.holidays.kinds). */
const KINDS: [RegExp, string][] = [
  [/^Winterferien|^Semesterferien/, 'winter'],
  [/^Halbjahres/, 'midyear'],
  [/^Fastnachtsferien|^Faschingsferien/, 'carnival'],
  [/^Frühjahrsferien/, 'spring'],
  [/^Osterferien/, 'easter'],
  [/^Pfingstferien/, 'pentecost'],
  [/^Sommerferien/, 'summer'],
  [/^Herbstferien/, 'autumn'],
  [/^Weihnachtsferien/, 'christmas'],
];

function rows(file: string) {
  const [header, ...lines] = readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  const cols = header.split(';');
  return lines.map((line) => {
    const cells = line.split(';');
    return Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? ''])) as Record<string, string>;
  });
}

const germanName = (field: string) =>
  decodeURIComponent((field.split(',').find((p) => p.startsWith('DE ')) ?? field).slice(3));

const kindOf = (name: string) => KINDS.find(([re]) => re.test(name))?.[1] ?? 'day';

type Entry = [string, string, string];
const regions: { code: string; name: string }[] = [];
const holidays: Record<string, Entry[]> = {};

function add(code: string, row: Record<string, string>) {
  const start = row.StartDate;
  const end = row.EndDate || start;
  if (end < FROM || start > TO) return;
  (holidays[code] ??= []).push([start, end, kindOf(germanName(row.Name))]);
}

// Deutschland: eine Datei je Bundesland. In MV gelten die Termine der allgemeinbildenden Schulen (MV-ABS),
// in SH nicht die Sondertermine der Inseln (Tag „Exception“).
for (const sub of rows(join(root, 'src/de/subdivisions.csv'))) {
  const short = sub.ShortName;
  regions.push({ code: sub.Code, name: germanName(sub.Name) });
  const file = readdirSync(join(root, 'src/de/holidays')).find((f) => f === `holidays.school.${short.toLowerCase()}.csv`);
  if (!file) continue;
  for (const row of rows(join(root, 'src/de/holidays', file))) {
    if ((row.Tags ?? '').includes('Exception')) continue;
    const subs = (row.Subdivisions ?? row.Groups ?? '').split(',').filter(Boolean);
    if (subs.length && !subs.some((s) => s === short || s === `${short}-ABS`)) continue;
    add(sub.Code, row);
  }
}

// Österreich: eine Datei; leere Subdivisions = bundesweit. Codes wie AT-9 (ISO) statt AT-WI.
const at = rows(join(root, 'src/at/subdivisions.csv'));
for (const sub of at) regions.push({ code: sub.IsoCode, name: germanName(sub.Name) });
for (const row of rows(join(root, 'src/at/holidays/holidays.school.csv'))) {
  const subs = (row.Subdivisions ?? '').split(',').filter(Boolean);
  for (const sub of at) if (!subs.length || subs.includes(sub.ShortName)) add(sub.IsoCode, row);
}

for (const list of Object.values(holidays)) list.sort((x, y) => x[0].localeCompare(y[0]));
const used = regions.filter((r) => holidays[r.code]?.length);

const out = `// Erzeugt mit scripts/holidays.ts – nicht von Hand ändern.
// Ferientermine: OpenHolidays (https://www.openholidaysapi.org), Lizenz ODbL 1.0. Ohne Gewähr.

export type HolidayKind =
  | 'winter'
  | 'midyear'
  | 'carnival'
  | 'spring'
  | 'easter'
  | 'pentecost'
  | 'summer'
  | 'autumn'
  | 'christmas'
  | 'day';

/** Schulferien-Regionen: Bundesländer in Deutschland und Österreich. */
export const HOLIDAY_REGIONS: { code: string; name: string }[] = ${JSON.stringify(used, null, 2)};

/** [erster Tag, letzter Tag, Art] je Region – von ${FROM} bis ${TO}. */
export const HOLIDAYS: Record<string, [string, string, HolidayKind][]> = ${JSON.stringify(holidays)};
`;
writeFileSync(join(__dirname, '..', 'src', 'data', 'holidays.ts'), out);
console.log(`${used.length} Regionen, ${Object.values(holidays).flat().length} Ferienzeiträume.`);
