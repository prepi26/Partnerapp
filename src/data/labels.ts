import { Couple, PartnerKey, WishCategory } from './types';

export const wishCategories: { key: WishCategory; label: string; emoji: string }[] = [
  { key: 'reise', label: 'Reise', emoji: '✈️' },
  { key: 'erlebnis', label: 'Erlebnis', emoji: '🎢' },
  { key: 'geschenk', label: 'Geschenk', emoji: '🎁' },
  { key: 'sonstiges', label: 'Sonstiges', emoji: '💫' },
];

export function categoryEmoji(key: WishCategory) {
  return wishCategories.find((c) => c.key === key)?.emoji ?? '💫';
}

export function authorName(couple: Couple, author: PartnerKey | 'both') {
  if (author === 'a') return couple.name_a;
  if (author === 'b') return couple.name_b;
  return 'Gemeinsam';
}

export const moodEmojis = ['😍', '🥰', '😊', '😌', '🥱', '😔', '😤', '🤒'];

export const dateEmojis = ['💖', '🎂', '💍', '🌹', '🥂', '✈️', '🏡', '🐶', '⭐️', '🎉'];
