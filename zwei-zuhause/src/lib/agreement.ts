import { currentT, Dict } from '@/i18n';

/**
 * Gliederung der Elternvereinbarung – angelehnt an gängige Umgangsvereinbarungen aus Beratungsstellen.
 * Jeder Abschnitt hat Leitfragen; die Eltern schreiben ihre Regel in eigenen Worten.
 */
export const AGREEMENT_KEYS = [
  'betreuung',
  'uebergabe',
  'ferien',
  'feiertage',
  'ausfall',
  'tausch',
  'kommunikation',
  'kontakt',
  'entscheidungen',
  'informationen',
  'reisen',
  'kosten',
  'sachen',
  'dritte',
  'umzug',
  'konflikte',
  'ueberpruefung',
] as const;

export function agreementSections(t: Dict = currentT()): { key: string; title: string; questions: string }[] {
  return AGREEMENT_KEYS.map((key) => ({ key, ...t.lib.agreementSections[key] }));
}
