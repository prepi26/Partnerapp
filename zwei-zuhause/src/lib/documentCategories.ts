import { DocumentCategory } from '@/data/types';

export const DOCUMENT_CATEGORIES: { key: DocumentCategory; label: string; emoji: string; examples: string }[] = [
  { key: 'schule', label: 'Schule & Kita', emoji: '🎒', examples: 'Zeugnis, Elternbrief, Kita-Vertrag, Stundenplan' },
  { key: 'gesundheit', label: 'Gesundheit', emoji: '🩺', examples: 'Arztbrief, Impfpass, Befund, Rezept' },
  { key: 'behoerde', label: 'Ämter & Ausweise', emoji: '🪪', examples: 'Kinderausweis, Bescheid, Vollmacht, Geburtsurkunde' },
  { key: 'sonstiges', label: 'Sonstiges', emoji: '📎', examples: 'Vereinsanmeldung, Versicherung' },
];

export function documentCategory(key: DocumentCategory) {
  return DOCUMENT_CATEGORIES.find((c) => c.key === key) ?? DOCUMENT_CATEGORIES[DOCUMENT_CATEGORIES.length - 1];
}
