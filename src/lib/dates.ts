import { ISODate } from '@/data/types';

const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Lokales Datum (Mitternacht) aus YYYY-MM-DD. */
export function parseISO(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(date: Date): ISODate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Ganze Kalendertage von a nach b (sommerzeitsicher). */
export function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / DAY_MS);
}

/** Datum + n Jahre; ein 29. Februar wird in Nicht-Schaltjahren zum 28. Februar. */
export function addYears(date: Date, years: number): Date {
  const y = date.getFullYear() + years;
  const lastDay = new Date(y, date.getMonth() + 1, 0).getDate();
  return new Date(y, date.getMonth(), Math.min(date.getDate(), lastDay));
}

export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

export function formatDate(iso: ISODate | Date): string {
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShort(iso: ISODate | Date): string {
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  return `${d.getDate()}. ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function monthYear(iso: ISODate): string {
  const d = parseISO(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Zusammen seit: aufgeteilt in Jahre, Monate, Tage. */
export function durationParts(start: Date, end: Date) {
  let years = end.getFullYear() - start.getFullYear();
  if (addYears(start, years) > end) years--;
  const afterYears = addYears(start, years);

  let months = (end.getFullYear() - afterYears.getFullYear()) * 12 + end.getMonth() - afterYears.getMonth();
  if (addMonths(afterYears, months) > end) months--;
  const afterMonths = addMonths(afterYears, months);

  return { years, months, days: daysBetween(afterMonths, end) };
}

/** Nächstes Vorkommen eines jährlichen Datums ab heute (inklusive heute). */
export function nextYearly(iso: ISODate, from: Date = today()) {
  const original = parseISO(iso);
  let years = from.getFullYear() - original.getFullYear();
  let next = addYears(original, years);
  if (next < from) {
    years++;
    next = addYears(original, years);
  }
  return { date: next, years, inDays: daysBetween(from, next) };
}

export interface Milestone {
  label: string;
  date: Date;
  inDays: number;
}

/** Die nächsten Meilensteine: runde Tageszahlen, Halbjahr und Jahrestage. */
export function upcomingMilestones(startIso: ISODate, count = 3, from: Date = today()): Milestone[] {
  const start = parseISO(startIso);
  const elapsed = daysBetween(start, from);
  const list: Milestone[] = [];

  const step = elapsed < 1000 ? 100 : 500;
  for (let n = Math.max(step, Math.ceil(elapsed / step) * step); list.length < 6; n += step) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + n);
    list.push({ label: `${formatNumber(n)} Tage`, date, inDays: n - elapsed });
  }

  const half = addMonths(start, 6);
  if (half >= from) list.push({ label: 'Ein halbes Jahr', date: half, inDays: daysBetween(from, half) });

  for (let y = 1; y <= 80; y++) {
    const date = addYears(start, y);
    if (date < from) continue;
    list.push({ label: y === 1 ? '1. Jahrestag' : `${y}. Jahrestag`, date, inDays: daysBetween(from, date) });
    if (list.filter((m) => m.label.includes('Jahrestag')).length >= 2) break;
  }

  return list.sort((a, b) => a.inDays - b.inDays).slice(0, count);
}

/** 12345 -> "12.345" (ohne Intl, das nicht auf jedem Gerät vollständig ist). */
export function formatNumber(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function countdownLabel(inDays: number): string {
  if (inDays === 0) return 'Heute!';
  if (inDays === 1) return 'Morgen';
  return `in ${inDays} Tagen`;
}
