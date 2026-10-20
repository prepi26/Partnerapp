import { Family, ISODate, ParentKey, ScheduleChange, ScheduleModel } from '@/data/types';

import { addDays, daysBetween, parseISO, toISO } from './dates';

/**
 * Umgangsmodelle als 14-Tage-Muster ab dem Starttag. F = wer am Starttag das Kind hat, O = der andere.
 * Gezählt wird, bei wem das Kind übernachtet.
 */
const PATTERNS: Record<Exclude<ScheduleModel, 'none'>, string> = {
  wechsel_7_7: 'FFFFFFFOOOOOOO',
  wechsel_2_2_5_5: 'FFOOFFFFFOOOOO',
  wechsel_2_2_3: 'FFOOFFFOOFFOOO',
  // Start an einem Montag: Mo–Do bei F, Fr–So beim anderen, die folgende Woche komplett bei F.
  residenz_we: 'FFFFOOOFFFFFFF',
};

export const MODELS: { key: ScheduleModel; title: string; text: string }[] = [
  { key: 'wechsel_7_7', title: 'Wechselmodell 7/7', text: 'Eine Woche hier, eine Woche dort.' },
  { key: 'wechsel_2_2_5_5', title: 'Wechselmodell 2-2-5-5', text: 'Feste Wochentage plus Wochenenden im Wechsel.' },
  { key: 'wechsel_2_2_3', title: 'Wechselmodell 2-2-3', text: 'Kurze Abstände – gut für kleine Kinder.' },
  {
    key: 'residenz_we',
    title: 'Residenzmodell',
    text: 'Das Kind lebt überwiegend bei einem, jedes zweite Wochenende (Fr–So) beim anderen.',
  },
  { key: 'none', title: 'Kein fester Plan', text: 'Ihr tragt jeden Tag einzeln ein.' },
];

export function other(key: ParentKey): ParentKey {
  return key === 'a' ? 'b' : 'a';
}

/** Bei wem ist das Kind laut Plan? null = kein Plan (oder vor dessen Beginn). */
export function plannedParent(family: Family, day: ISODate | Date): ParentKey | null {
  if (family.schedule_model === 'none') return null;
  const date = typeof day === 'string' ? parseISO(day) : day;
  const offset = daysBetween(parseISO(family.schedule_start), date);
  if (offset < 0) return null;
  const pattern = PATTERNS[family.schedule_model];
  const index = offset % pattern.length;
  return pattern[index] === 'F' ? family.schedule_first : other(family.schedule_first);
}

/** Bestätigte Ausnahmen je Tag; spätere Einträge gewinnen. */
export function acceptedChanges(changes: ScheduleChange[]): Map<ISODate, ScheduleChange> {
  const map = new Map<ISODate, ScheduleChange>();
  const sorted = changes
    .filter((c) => c.status === 'accepted')
    .sort((x, y) => (x.answered_at ?? x.created_at).localeCompare(y.answered_at ?? y.created_at));
  for (const c of sorted) map.set(c.day, c);
  return map;
}

export interface DayInfo {
  parent: ParentKey | null;
  /** Abweichung vom Plan (bestätigt). */
  change?: ScheduleChange;
  /** Offener Vorschlag für diesen Tag. */
  proposal?: ScheduleChange;
}

export function dayInfo(
  family: Family,
  accepted: Map<ISODate, ScheduleChange>,
  proposals: Map<ISODate, ScheduleChange>,
  day: Date,
): DayInfo {
  const iso = toISO(day);
  const change = accepted.get(iso);
  return { parent: change ? change.parent : plannedParent(family, day), change, proposal: proposals.get(iso) };
}

/** Nächster Tag, an dem das Kind wechselt (innerhalb von 60 Tagen). */
export function nextHandover(
  family: Family,
  accepted: Map<ISODate, ScheduleChange>,
  from: Date,
): { day: Date; to: ParentKey } | null {
  const proposals = new Map<ISODate, ScheduleChange>();
  let current = dayInfo(family, accepted, proposals, from).parent;
  for (let i = 1; i <= 60; i++) {
    const day = addDays(from, i);
    const parent = dayInfo(family, accepted, proposals, day).parent;
    if (parent && current && parent !== current) return { day, to: parent };
    if (parent) current = parent;
  }
  return null;
}
