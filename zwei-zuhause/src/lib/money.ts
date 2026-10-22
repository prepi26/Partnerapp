import { Expense, NeedType, ParentKey } from '@/data/types';
import { currentT, Dict } from '@/i18n';

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

const CATEGORY_EMOJI = {
  kleidung: '👕',
  schule: '🎒',
  gesundheit: '🩺',
  freizeit: '⚽',
  urlaub: '🏖️',
  betreuung: '🧸',
  sonstiges: '📦',
} as const;
type CategoryKey = keyof typeof CATEGORY_EMOJI;

export function categories(t: Dict = currentT()): { key: CategoryKey; label: string; emoji: string }[] {
  return (Object.keys(CATEGORY_EMOJI) as CategoryKey[]).map((key) => ({
    key,
    label: t.lib.expenseCategories[key],
    emoji: CATEGORY_EMOJI[key],
  }));
}

export function categoryOf(key: string, t: Dict = currentT()) {
  const all = categories(t);
  return all.find((c) => c.key === key) ?? all[all.length - 1];
}

const NEED_KEYS: NeedType[] = ['regular', 'mehrbedarf', 'sonderbedarf'];

/** Nur zur Orientierung – die Einordnung im Einzelfall ist keine Frage, die die App beantwortet. */
export function needs(t: Dict = currentT()): { key: NeedType; label: string; text: string }[] {
  return NEED_KEYS.map((key) => ({ key, ...t.lib.needs[key] }));
}

export function needOf(key: NeedType, t: Dict = currentT()) {
  return { key, ...(t.lib.needs[key] ?? t.lib.needs.regular) };
}
