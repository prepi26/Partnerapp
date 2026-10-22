import { currentT, Dict } from '@/i18n';

/**
 * Themen, bei denen Eltern mit gemeinsamer Sorge sich in der Regel einigen müssen
 * (§ 1687 BGB, „Angelegenheiten von erheblicher Bedeutung“). Nur zur Orientierung.
 */
const DECISION_EMOJI = {
  schule: '🎒',
  gesundheit: '🩺',
  reise: '✈️',
  wohnort: '🏠',
  religion: '🕊️',
  freizeit: '⚽',
  sonstiges: '📌',
} as const;
type DecisionKey = keyof typeof DECISION_EMOJI;

export function decisionCategories(t: Dict = currentT()) {
  return (Object.keys(DECISION_EMOJI) as DecisionKey[]).map((key) => ({
    key,
    emoji: DECISION_EMOJI[key],
    ...t.lib.decisionCategories[key],
  }));
}

export function decisionCategory(key: string, t: Dict = currentT()) {
  const all = decisionCategories(t);
  return all.find((c) => c.key === key) ?? all[all.length - 1];
}
