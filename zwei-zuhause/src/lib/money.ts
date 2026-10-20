import { Expense, ParentKey } from '@/data/types';

/** 1234 -> "12,34 €" (ohne Intl, das nicht auf jedem Gerät vollständig ist). */
export function formatMoney(cents: number): string {
  const sign = cents < 0 ? '−' : '';
  const abs = Math.abs(Math.round(cents));
  const euros = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${euros},${String(abs % 100).padStart(2, '0')} €`;
}

/** "12,5" / "12.50" / "1.234,56" -> Cent. null bei ungültiger Eingabe. */
export function parseMoney(text: string): number | null {
  let clean = text.replace(/[€\s]/g, '');
  if (!clean) return null;
  if (clean.includes(',')) clean = clean.replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null;
  const cents = Math.round(parseFloat(clean) * 100);
  return cents > 0 ? cents : null;
}

/** Anteil (in Cent), den Elternteil `who` an einer Ausgabe trägt. */
export function shareOf(expense: Pick<Expense, 'amount_cents' | 'share_a'>, who: ParentKey): number {
  const a = Math.round((expense.amount_cents * expense.share_a) / 100);
  return who === 'a' ? a : expense.amount_cents - a;
}

/**
 * Wie viel b an a schuldet (negativ: a schuldet b). Abgelehnte Einträge zählen nicht,
 * offene schon – sie sind nur noch nicht bestätigt.
 */
export function balanceAB(expenses: Expense[]): number {
  let balance = 0;
  for (const e of expenses) {
    if (e.status === 'disputed') continue;
    if (e.kind === 'payment') balance += e.paid_by === 'a' ? e.amount_cents : -e.amount_cents;
    else if (e.paid_by === 'a') balance += shareOf(e, 'b');
    else balance -= shareOf(e, 'a');
  }
  return balance;
}

export const CATEGORIES: { key: string; label: string; emoji: string }[] = [
  { key: 'kleidung', label: 'Kleidung', emoji: '👕' },
  { key: 'schule', label: 'Schule & Kita', emoji: '🎒' },
  { key: 'gesundheit', label: 'Gesundheit', emoji: '🩺' },
  { key: 'freizeit', label: 'Hobby & Verein', emoji: '⚽' },
  { key: 'urlaub', label: 'Ferien & Ausflüge', emoji: '🏖️' },
  { key: 'betreuung', label: 'Betreuung', emoji: '🧸' },
  { key: 'sonstiges', label: 'Sonstiges', emoji: '📦' },
];

export function categoryOf(key: string) {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}
