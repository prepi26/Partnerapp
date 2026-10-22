import { DocumentCategory } from '@/data/types';
import { currentT, Dict } from '@/i18n';

const DOCUMENT_EMOJI: Record<DocumentCategory, string> = {
  schule: '🎒',
  gesundheit: '🩺',
  behoerde: '🪪',
  sonstiges: '📎',
};

export function documentCategories(t: Dict = currentT()) {
  return (Object.keys(DOCUMENT_EMOJI) as DocumentCategory[]).map((key) => ({
    key,
    emoji: DOCUMENT_EMOJI[key],
    ...t.lib.documentCategories[key],
  }));
}

export function documentCategory(key: DocumentCategory, t: Dict = currentT()) {
  const all = documentCategories(t);
  return all.find((c) => c.key === key) ?? all[all.length - 1];
}
