/**
 * Themen, bei denen Eltern mit gemeinsamer Sorge sich in der Regel einigen müssen
 * (§ 1687 BGB, „Angelegenheiten von erheblicher Bedeutung“). Nur zur Orientierung.
 */
export const DECISION_CATEGORIES: { key: string; label: string; emoji: string; examples: string }[] = [
  { key: 'schule', label: 'Schule & Kita', emoji: '🎒', examples: 'Schulwahl, Schulwechsel, Kita-Platz, Förderschule' },
  { key: 'gesundheit', label: 'Gesundheit', emoji: '🩺', examples: 'Operation, Impfungen, Therapie, Zahnspange' },
  { key: 'reise', label: 'Reisen', emoji: '✈️', examples: 'Auslandsreise, Fernreise, Schüleraustausch, Reisepass' },
  { key: 'wohnort', label: 'Wohnort', emoji: '🏠', examples: 'Umzug, Wechsel des Lebensmittelpunkts' },
  { key: 'religion', label: 'Religion & Name', emoji: '🕊️', examples: 'Taufe, Religionsunterricht, Namensänderung' },
  { key: 'freizeit', label: 'Freizeit', emoji: '⚽', examples: 'Verein, Instrument, Handy, Ferienlager' },
  { key: 'sonstiges', label: 'Sonstiges', emoji: '📌', examples: '' },
];

export function decisionCategory(key: string) {
  return DECISION_CATEGORIES.find((c) => c.key === key) ?? DECISION_CATEGORIES[DECISION_CATEGORIES.length - 1];
}
