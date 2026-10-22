import type { Dict, Lang } from './index';
import { de } from './de';
import { ru } from './ru';
import { uk } from './uk';
import { fr } from './fr';
import { en } from './en';

/** Alle Sprachen. Fehlt eine Übersetzung noch, gilt Deutsch. */
export const DICTS: Record<Lang, Dict> = {
  de,
  en,
  tr: de,
  ar: de,
  ru,
  uk,
  pl: de,
  sq: de,
  ro: de,
  sr: de,
  fr,
};
