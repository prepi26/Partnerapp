import { ISODate, MaintenancePayment, MaintenanceTerm } from '@/data/types';
import { currentT, Dict } from '@/i18n';

import { parseISO } from './dates';

export type MonthStatus = 'paid' | 'partial' | 'open' | 'more';

export interface MonthRow {
  month: ISODate;
  term: MaintenanceTerm | null;
  /** Soll in Cent (0 = nichts vereinbart). */
  due: number;
  /** Bestätigt gezahlt. */
  confirmed: number;
  /** Eingetragen, aber noch nicht bestätigt. */
  open: number;
  status: MonthStatus | null;
}

/** Monatsanfang „YYYY-MM-01“. */
export function monthStart(date: Date): ISODate {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export function addMonths(month: ISODate, n: number): ISODate {
  const d = parseISO(month);
  return monthStart(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

/** Welcher Betrag gilt in diesem Monat? Der neueste Eintrag mit dem spätesten Beginn ≤ Monat. */
export function termFor(terms: MaintenanceTerm[], month: ISODate): MaintenanceTerm | null {
  let best: MaintenanceTerm | null = null;
  for (const t of terms) {
    if (t.valid_from > month) continue;
    if (!best || t.valid_from > best.valid_from || (t.valid_from === best.valid_from && t.created_at > best.created_at))
      best = t;
  }
  return best;
}

/** Soll und Ist je Monat – vom ersten Eintrag bis heute, neueste zuerst (höchstens `limit` Monate). */
export function monthRows(
  terms: MaintenanceTerm[],
  payments: MaintenancePayment[],
  today: Date,
  limit = 24,
): MonthRow[] {
  const starts = [...terms.map((t) => t.valid_from), ...payments.map((p) => p.month)].sort();
  if (!starts.length) return [];
  return monthRowsBetween(terms, payments, starts[0], monthStart(today)).slice(0, limit);
}

/** Soll und Ist für alle Monate, die den Zeitraum from–to berühren, neueste zuerst. */
export function monthRowsBetween(
  terms: MaintenanceTerm[],
  payments: MaintenancePayment[],
  from: ISODate,
  to: ISODate,
): MonthRow[] {
  const first = monthStart(parseISO(from));
  const rows: MonthRow[] = [];
  for (let month = monthStart(parseISO(to)); month >= first; month = addMonths(month, -1)) {
    const term = termFor(terms, month);
    const due = term?.amount_cents ?? 0;
    let confirmed = 0;
    let open = 0;
    for (const p of payments) {
      if (p.month !== month || (term && p.payer !== term.payer)) continue;
      if (p.status === 'confirmed') confirmed += p.amount_cents;
      else if (p.status === 'open') open += p.amount_cents;
    }
    const status: MonthStatus | null = !due
      ? null
      : confirmed > due
        ? 'more'
        : confirmed === due
          ? 'paid'
          : confirmed > 0
            ? 'partial'
            : 'open';
    rows.push({ month, term, due, confirmed, open, status });
  }
  return rows;
}

export function statusLabel(status: MonthStatus, t: Dict = currentT()) {
  const m = t.money.maintenance;
  return {
    paid: m.statusPaid,
    partial: m.statusPartial,
    open: m.statusOpen,
    more: m.statusMore,
  }[status];
}
