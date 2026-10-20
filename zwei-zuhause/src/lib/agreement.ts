/**
 * Gliederung der Elternvereinbarung – angelehnt an gängige Umgangsvereinbarungen aus Beratungsstellen.
 * Jeder Abschnitt hat Leitfragen; die Eltern schreiben ihre Regel in eigenen Worten.
 */
export const AGREEMENT_SECTIONS: { key: string; title: string; questions: string }[] = [
  {
    key: 'betreuung',
    title: 'Betreuungsmodell & Rhythmus',
    questions: 'Wechsel- oder Residenzmodell? Welche Tage bei wem, ab wann gilt der Plan?',
  },
  {
    key: 'uebergabe',
    title: 'Übergaben',
    questions: 'Wo und wann? Wer bringt, wer holt? Wie viel Verspätung ist okay, wie sagt man Bescheid?',
  },
  {
    key: 'ferien',
    title: 'Ferien',
    questions: 'Wie werden Schulferien aufgeteilt? Bis wann wird geplant (z. B. Sommerferien bis 31. Januar)?',
  },
  {
    key: 'feiertage',
    title: 'Feiertage & Geburtstage',
    questions: 'Weihnachten, Ostern, Silvester, Geburtstage des Kindes und der Eltern – jährlich im Wechsel?',
  },
  {
    key: 'ausfall',
    title: 'Krankheit & Ausfall',
    questions: 'Was passiert, wenn das Kind krank ist oder ein Termin ausfällt? Wird nachgeholt? Absagefrist?',
  },
  {
    key: 'tausch',
    title: 'Tausch & Änderungen',
    questions: 'Wie fragt man nach einem Tausch, und bis wann wird geantwortet?',
  },
  {
    key: 'kommunikation',
    title: 'Kommunikation',
    questions: 'Über welchen Weg (z. B. diese App)? Antwort innerhalb von …? Keine Botschaften über das Kind.',
  },
  {
    key: 'kontakt',
    title: 'Kontakt zum Kind',
    questions: 'Telefon- oder Videoanrufe, während das Kind beim anderen ist – wann und wie oft?',
  },
  {
    key: 'entscheidungen',
    title: 'Entscheidungen',
    questions: 'Was entscheidet, wer gerade betreut? Was entscheiden wir gemeinsam (Schule, Gesundheit, Reisen)?',
  },
  {
    key: 'informationen',
    title: 'Informationen',
    questions: 'Wie teilen wir Zeugnisse, Arzttermine, Elternabende? Wer ist bei Schule und Kita eingetragen?',
  },
  {
    key: 'reisen',
    title: 'Reisen & Ausweise',
    questions: 'Wer verwahrt den Kinderreisepass? Wie weit vorher wird eine Reise angekündigt?',
  },
  {
    key: 'kosten',
    title: 'Kosten',
    questions: 'Unterhalt, Kindergeld, Aufteilung von Extras (Verein, Klassenfahrt, Zahnspange), Taschengeld.',
  },
  {
    key: 'sachen',
    title: 'Sachen des Kindes',
    questions: 'Was wechselt mit (Kleidung, Medikamente, Schulsachen, Kuscheltier), was bleibt?',
  },
  {
    key: 'dritte',
    title: 'Neue Partner & Familie',
    questions: 'Wie gehen wir mit neuen Partnern um? Kontakt zu Großeltern und Verwandten?',
  },
  {
    key: 'umzug',
    title: 'Umzug',
    questions: 'Wie früh kündigen wir einen Umzug an?',
  },
  {
    key: 'konflikte',
    title: 'Wenn wir uneins sind',
    questions: 'Erst Gespräch, dann Beratungsstelle oder Jugendamt, dann Mediation?',
  },
  {
    key: 'ueberpruefung',
    title: 'Überprüfung',
    questions: 'Wann schauen wir wieder drauf – jährlich, beim Schulwechsel?',
  },
];

export const AGREEMENT_NOTE =
  'Diese Vereinbarung ist eine Absprache zwischen den Eltern. Ohne gerichtliche Billigung ist sie nicht vollstreckbar. ' +
  'Jugendamt und Beratungsstellen helfen kostenlos dabei, sie zu erarbeiten.';
