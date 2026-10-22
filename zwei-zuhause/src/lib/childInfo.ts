import { currentT, Dict } from '@/i18n';

/** Bereiche der Kind-Infos mit Vorschlägen, was typischerweise hineingehört. */
const INFO_EMOJI = {
  gesundheit: '🩺',
  schule: '🎒',
  groessen: '📏',
  dokumente: '🪪',
  kontakte: '📞',
  alltag: '🧸',
  sonstiges: '📌',
} as const;
type InfoKey = keyof typeof INFO_EMOJI;

export function infoCategories(t: Dict = currentT()) {
  return (Object.keys(INFO_EMOJI) as InfoKey[]).map((key) => ({
    key,
    emoji: INFO_EMOJI[key],
    ...t.lib.infoCategories[key],
  }));
}

export function infoCategory(key: string, t: Dict = currentT()) {
  const all = infoCategories(t);
  return all.find((c) => c.key === key) ?? all[all.length - 1];
}
