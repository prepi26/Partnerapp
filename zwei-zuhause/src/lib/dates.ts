import { ISODate } from '@/data/types';
import { currentT, Dict, fmt } from '@/i18n';

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

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Ganze Kalendertage von a nach b (sommerzeitsicher). */
export function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / DAY_MS);
}

export function formatDate(iso: ISODate | Date, t: Dict = currentT()): string {
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  return fmt(t.common.dates.long, { d: d.getDate(), month: t.common.dates.months[d.getMonth()], y: d.getFullYear() });
}

export function formatShort(iso: ISODate | Date, t: Dict = currentT()): string {
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  return fmt(t.common.dates.short, { d: d.getDate(), mon: t.common.dates.months[d.getMonth()].slice(0, 3) });
}

/** „Freitag, 24. Oktober“ */
export function formatWeekday(iso: ISODate | Date, t: Dict = currentT()): string {
  const d = typeof iso === 'string' ? parseISO(iso) : iso;
  return fmt(t.common.dates.weekday, {
    weekday: t.common.dates.weekdays[d.getDay()],
    d: d.getDate(),
    month: t.common.dates.months[d.getMonth()],
  });
}

/** „Oktober 2026“ */
export function formatMonth(date: Date, t: Dict = currentT()): string {
  return `${t.common.dates.months[date.getMonth()]} ${date.getFullYear()}`;
}

/** Datum und Uhrzeit eines Zeitstempels, z. B. „24.10.2026, 18:05“. Für Nachweise immer mit Jahr. */
export function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function countdownLabel(inDays: number, t: Dict = currentT()): string {
  if (inDays === 0) return t.common.dates.today;
  if (inDays === 1) return t.common.dates.tomorrow;
  return fmt(t.common.dates.inDays, { n: inDays });
}
