import { HOLIDAY_REGIONS, HOLIDAYS, HolidayKind } from '@/data/holidays';
import { ISODate } from '@/data/types';
import { currentT, Dict } from '@/i18n';

import { addDays, parseISO, toISO } from './dates';

export interface Holiday {
  start: ISODate;
  end: ISODate;
  kind: HolidayKind;
}

export function holidaysOf(region: string): Holiday[] {
  return (HOLIDAYS[region] ?? []).map(([start, end, kind]) => ({ start, end, kind }));
}

/** Ferien, die heute oder später enden – einzelne schulfreie Tage nur auf Wunsch. */
export function upcomingHolidays(region: string, from: ISODate, withDays = false): Holiday[] {
  return holidaysOf(region).filter((h) => h.end >= from && (withDays || h.kind !== 'day'));
}

/** Welche Ferien sind an diesem Tag? */
export function holidayOn(region: string, day: ISODate): Holiday | null {
  return holidaysOf(region).find((h) => h.start <= day && day <= h.end) ?? null;
}

export function holidayDays(h: Holiday): ISODate[] {
  const days: ISODate[] = [];
  for (let d = parseISO(h.start); toISO(d) <= h.end; d = addDays(d, 1)) days.push(toISO(d));
  return days;
}

export function holidayName(kind: HolidayKind, t: Dict = currentT()) {
  return t.calendar.holidays.kinds[kind];
}

export function regionName(code: string) {
  return HOLIDAY_REGIONS.find((r) => r.code === code)?.name ?? '';
}

const byName = (x: { name: string }, y: { name: string }) => x.name.localeCompare(y.name, 'de');
export const REGIONS_DE = HOLIDAY_REGIONS.filter((r) => r.code.startsWith('DE-')).sort(byName);
export const REGIONS_AT = HOLIDAY_REGIONS.filter((r) => r.code.startsWith('AT-')).sort(byName);
