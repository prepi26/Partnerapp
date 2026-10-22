import { currentT, Dict } from '@/i18n';

/**
 * Einfacher Ton-Check vor dem Senden: findet typische Eskalations-Muster.
 * Kein Urteil über den Inhalt – nur ein kurzer Moment zum Durchatmen.
 * Die Wort-Muster sind deutsch; Satzzeichen und Großbuchstaben gelten in jeder Sprache.
 */
const PATTERNS: { test: RegExp; hint: keyof Dict['lib']['tone'] }[] = [
  { test: /\b(immer|nie|niemals)\b/i, hint: 'always' },
  { test: /\b(idiot|bescheuert|dumm|unfähig|lächerlich|asozial|krank|peinlich|schämen?)\b/i, hint: 'insult' },
  { test: /\b(anwalt|gericht|jugendamt)\b.*\b(wirst|werde|dann)\b/i, hint: 'threat' },
  { test: /!{2,}|\?{2,}/, hint: 'punctuation' },
  { test: /\b[A-ZÄÖÜ]{5,}\b/, hint: 'caps' },
];

export function toneHints(text: string, t: Dict = currentT()): string[] {
  return PATTERNS.filter((p) => p.test.test(text)).map((p) => t.lib.tone[p.hint]);
}
