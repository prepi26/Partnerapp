/** Bereiche der Kind-Infos mit Vorschlägen, was typischerweise hineingehört. */
export const INFO_CATEGORIES: { key: string; label: string; emoji: string; suggestions: string[] }[] = [
  {
    key: 'gesundheit',
    label: 'Gesundheit',
    emoji: '🩺',
    suggestions: ['Kinderarzt', 'Zahnarzt', 'Krankenkasse', 'Allergien', 'Medikamente', 'Impfungen', 'Blutgruppe'],
  },
  {
    key: 'schule',
    label: 'Schule & Kita',
    emoji: '🎒',
    suggestions: ['Schule / Kita', 'Klasse / Gruppe', 'Klassenlehrer:in', 'Schulzeiten', 'Hort / Betreuung'],
  },
  { key: 'groessen', label: 'Größen', emoji: '📏', suggestions: ['Kleidergröße', 'Schuhgröße', 'Körpergröße'] },
  {
    key: 'dokumente',
    label: 'Dokumente',
    emoji: '🪪',
    suggestions: ['Kinderreisepass', 'Personalausweis', 'Steuer-ID', 'Krankenversicherungskarte'],
  },
  {
    key: 'kontakte',
    label: 'Kontakte',
    emoji: '📞',
    suggestions: ['Großeltern', 'Babysitter', 'Trainer:in', 'Beste Freundin / bester Freund'],
  },
  {
    key: 'alltag',
    label: 'Alltag',
    emoji: '🧸',
    suggestions: ['Schlafenszeit', 'Lieblingsessen', 'Kuscheltier', 'Medienzeit', 'Hobbys'],
  },
  { key: 'sonstiges', label: 'Sonstiges', emoji: '📌', suggestions: [] },
];

export function infoCategory(key: string) {
  return INFO_CATEGORIES.find((c) => c.key === key) ?? INFO_CATEGORIES[INFO_CATEGORIES.length - 1];
}
