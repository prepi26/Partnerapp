/**
 * Einfacher Ton-Check vor dem Senden: findet typische Eskalations-Muster.
 * Kein Urteil über den Inhalt – nur ein kurzer Moment zum Durchatmen.
 */
const PATTERNS: { test: RegExp; hint: string }[] = [
  { test: /\b(immer|nie|niemals)\b/i, hint: '„Immer“ und „nie“ klingen nach Vorwurf. Ein konkreter Fall wirkt sachlicher.' },
  {
    test: /\b(idiot|bescheuert|dumm|unfähig|lächerlich|asozial|krank|peinlich|schämen?)\b/i,
    hint: 'Abwertende Wörter tauchen später in jedem Bericht auf – auch beim Jugendamt.',
  },
  { test: /\b(anwalt|gericht|jugendamt)\b.*\b(wirst|werde|dann)\b/i, hint: 'Drohungen verhärten Fronten. Schreib lieber, was du dir wünschst.' },
  { test: /!{2,}|\?{2,}/, hint: 'Mehrere Ausrufe- oder Fragezeichen wirken laut.' },
  { test: /\b[A-ZÄÖÜ]{5,}\b/, hint: 'Großbuchstaben lesen sich wie Schreien.' },
];

export function toneHints(text: string): string[] {
  return PATTERNS.filter((p) => p.test.test(text)).map((p) => p.hint);
}
