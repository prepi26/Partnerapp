/** Texte: Kalender, Tauschvorschlag, Umgangsplan und Übergaben. */
export const calendar = {
  /** Zitat eines Freitexts, z. B. einer Begründung. {text} der zitierte Text */
  quote: '„{text}“',
  calendar: {
    title: 'Kalender',
    scheduleButton: 'Umgangsplan',
    prevMonth: 'Voriger Monat',
    nextMonth: 'Nächster Monat',
    /** Screenreader-Text eines Kalendertags. {date} Wochentag mit Datum, {who} Elternteil oder „nicht eingetragen“ */
    dayA11y: '{date}: {who}',
    notEntered: 'nicht eingetragen',
    /** {where} Uhrzeit/Ort der Übergabe */
    handoverWhere: 'Übergabe: {where}',
    hint: 'Tipp auf einen Tag, um einen Tausch vorzuschlagen. Punkt = vereinbarte Ausnahme, Rahmen = offener Vorschlag.',
    openSection: 'Offene Vorschläge',
    /** Eigener Vorschlag, Kind beim anderen Elternteil {name} */
    proposalMine: 'Du schlägst vor: Kind bei {name}',
    /** Eigener Vorschlag, Kind bei mir */
    proposalMineAtYou: 'Du schlägst vor: Kind bei dir',
    /** Vorschlag des anderen, Kind bei {name} */
    proposalOther: 'Vorschlag: Kind bei {name}',
    /** Vorschlag des anderen, Kind bei mir */
    proposalOtherAtYou: 'Vorschlag: Kind bei dir',
    /** {date} Zeitstempel */
    createdAt: 'Gestellt am {date}',
    accept: 'Annehmen',
    decline: 'Ablehnen',
    withdraw: 'Zurückziehen',
    answeredSection: 'Zuletzt beantwortet',
    /** {date} Wochentag mit Datum, {name} Elternteil */
    answeredAccepted: '{date}: bei {name} – angenommen',
    /** {date} Wochentag mit Datum, {name} Elternteil */
    answeredDeclined: '{date}: bei {name} – abgelehnt',
  },
  changeNew: {
    oneDay: 'Ein Tag',
    range: 'Zeitraum (z. B. Ferien)',
    from: 'Von',
    day: 'Tag',
    until: 'Bis einschließlich',
    /** {n} Anzahl Tage – Einzahl */
    daysOne: '{n} Tag',
    /** {n} Anzahl Tage – Mehrzahl */
    daysOther: '{n} Tage',
    /** Anhängsel in Klammern. {max} Höchstzahl Tage */
    maxDays: 'höchstens {max} auf einmal',
    planned: 'Laut Plan',
    atYou: 'bei dir',
    /** {name} Elternteil */
    atName: 'bei {name}',
    noPlan: 'Kein Plan für diesen Tag',
    childShouldBe: 'Das Kind soll sein bei',
    /** Auswahl „bei mir“ */
    me: 'mir',
    noteLabel: 'Begründung (optional)',
    notePlaceholder: 'z. B. Geburtstag der Oma, Dienstreise',
    send: 'Vorschlag senden',
    enter: 'Eintragen',
    /** {name} anderer Elternteil */
    needsConsent: '{name} muss zustimmen. Erst dann gilt die Änderung – beides wird mit Datum festgehalten.',
    /** {name} anderer Elternteil */
    notJoined: 'Solange {name} nicht verbunden ist, kannst du den Vorschlag selbst annehmen.',
  },
  schedule: {
    start: 'Plan beginnt am',
    firstParent: 'An diesem Tag ist das Kind bei',
    residenzHint: 'Wähle als Start einen Montag. Das Wochenende dieser Woche (Fr–So) ist beim anderen Elternteil.',
    preview: 'Vorschau',
    handover: 'Übergabe – wann und wo?',
    time: 'Uhrzeit',
    timePlaceholder: 'z. B. 17:00',
    timeError: 'Bitte als Uhrzeit eingeben, z. B. 17:00.',
    place: 'Ort',
    placePlaceholder: 'z. B. Kita Sonnenschein, Schule, vor der Haustür',
    placeHint: 'Neutrale Orte wie Kita oder Schule entlasten das Kind – es muss sich nicht vor beiden Eltern verabschieden.',
    save: 'Plan speichern',
    /** {name} anderer Elternteil */
    sharedJoined: 'Der Plan gilt für euch beide. {name} sieht die Änderung sofort.',
    /** {name} anderer Elternteil */
    sharedNotJoined: 'Sobald {name} verbunden ist, gilt derselbe Plan auf beiden Handys.',
    singleDays: 'Einzelne Tage ändert ihr im Kalender per Tauschvorschlag.',
  },
  handovers: {
    intro:
      'Halte kurz fest, wie eine Übergabe gelaufen ist. Der andere Elternteil kann bestätigen oder widersprechen – ' +
      'so entsteht ein faires Bild statt zwei Erinnerungen.',
    statOnTime: 'pünktlich',
    statLate: 'verspätet',
    statMissed: 'ausgefallen',
    emptyTitle: 'Noch keine Übergaben',
    emptyText: 'Ein Tipp nach jeder Übergabe genügt – auch wenn alles gut lief. Gerade das zeigt, dass es klappt.',
    enteredByYou: 'Von dir eingetragen',
    /** {name} anderer Elternteil */
    enteredBy: 'Von {name} eingetragen',
    confirmed: 'bestätigt',
    disputed: 'widersprochen',
    /** {name} anderer Elternteil */
    noReply: 'Noch keine Rückmeldung von {name}',
    yes: 'Stimmt so',
    no: 'Stimmt nicht',
    replyPlaceholder: 'z. B. Stau auf der A3, kurz Bescheid gegeben',
    add: 'Übergabe eintragen',
  },
  handoverNew: {
    day: 'Tag der Übergabe',
    how: 'Wie lief es?',
    howLate: 'Wie viel später?',
    noteLabel: 'Notiz (optional)',
    notePlaceholderMissed: 'z. B. Kurzfristig per Nachricht abgesagt',
    notePlaceholder: 'z. B. Sportsachen fehlten',
    enter: 'Eintragen',
    hint: 'Einträge können nicht geändert oder gelöscht werden. Bleib bei dem, was passiert ist – ohne Bewertung.',
  },
};
