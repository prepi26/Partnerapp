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
    hint: 'Tipp auf einen Tag, um einen Tausch vorzuschlagen. Punkt = vereinbarte Ausnahme, Rahmen = offener Vorschlag, Strich oben = Schulferien.',
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
    customLength: 'Rhythmus über',
    /** {n} Anzahl Wochen */
    customWeeksOne: '1 Woche',
    customWeeksOther: '{n} Wochen',
    customHint: 'Tipp auf einen Tag, um ihn dem anderen Elternteil zu geben. Der Rhythmus beginnt am Starttag und wiederholt sich danach.',
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
  holidays: {
    title: 'Schulferien',
    /** Zeile unter dem Kalender. {region} Bundesland */
    calendarLink: '🏖 Schulferien: {region}',
    calendarLinkNone: '🏖 Schulferien einblenden',
    /** Hinweis, wenn im angezeigten Monat Ferien sind. {name} Ferienart, {from}–{to} Datum */
    inMonth: '{name}: {from} – {to}',
    region: 'Wo geht das Kind zur Schule?',
    regionHint: 'Die Ferien erscheinen im Kalender – für euch beide.',
    none: 'Keine Ferien anzeigen',
    germany: 'Deutschland',
    austria: 'Österreich',
    upcoming: 'Die nächsten Ferien',
    /** {from}–{to} Datum, {n} Anzahl Tage */
    range: '{from} – {to} · {n} Tage',
    rangeOne: '{from} · 1 Tag',
    /** Wie viele Tage davon bei wem laut Plan. {a}/{b} Namen, {na}/{nb} Anzahl */
    split: 'Laut Plan: {na} bei {a}, {nb} bei {b}',
    propose: 'Aufteilung vorschlagen',
    hint: 'Ferien sind die häufigste Streitfrage. Sprecht sie früh ab – am besten Monate vorher.',
    source: 'Ferientermine: OpenHolidays (openholidaysapi.org), Lizenz ODbL. Ohne Gewähr – im Zweifel gilt die Schule.',
    /** Startseite. {name} Ferienart, {countdown} z. B. „in 3 Wochen“ */
    homeCard: '🏖 {name} beginnen {countdown}',
    homeCardText: 'Schon abgesprochen, wer wann das Kind hat?',
    /** {n} Wochen */
    inWeeks: 'in {n} Wochen',
    kinds: {
      winter: 'Winterferien',
      midyear: 'Halbjahresferien',
      carnival: 'Faschingsferien',
      spring: 'Frühjahrsferien',
      easter: 'Osterferien',
      pentecost: 'Pfingstferien',
      summer: 'Sommerferien',
      autumn: 'Herbstferien',
      christmas: 'Weihnachtsferien',
      day: 'Schulfreier Tag',
    },
  },
  sync: {
    title: 'Im Handy-Kalender',
    calendarLink: '📲 Im Handy-Kalender anzeigen',
    intro:
      'Euer Umgangsplan erscheint in deinem normalen Kalender – iPhone, Google oder Outlook – und aktualisiert sich ' +
      'von selbst, auch nach einem Tausch.',
    open: 'Kalender abonnieren',
    share: 'Link teilen oder kopieren',
    /** Nachricht beim Teilen. {url} Adresse */
    shareMessage: 'Mein Kalender-Abo für Zwei Zuhause: {url}',
    googleTitle: 'Google Kalender (Android)',
    googleText:
      'Link teilen oder kopieren, dann am Computer calendar.google.com öffnen → „Weitere Kalender“ → „Per URL“ → Link einfügen.',
    iphoneTitle: 'iPhone',
    iphoneText: '„Kalender abonnieren“ tippen und bestätigen. Der Kalender heißt „Zwei Zuhause“.',
    privacy:
      'Wer den Link kennt, sieht euren Plan mit den Namen. Teile ihn nicht mit anderen. Kalender-Apps holen Änderungen meist alle paar Stunden.',
    renew: 'Neuen Link erzeugen',
    renewTitle: 'Neuen Link erzeugen?',
    renewText: 'Der alte Link funktioniert dann nicht mehr. Du musst den Kalender neu abonnieren.',
    stop: 'Kalender-Abo beenden',
    stopTitle: 'Kalender-Abo beenden?',
    stopText: 'Der Link funktioniert dann nicht mehr. Lösch den Kalender auch in deiner Kalender-App.',
    stopped: 'Das Kalender-Abo ist beendet.',
    noPlan: 'Legt zuerst einen Umgangsplan fest – sonst bleibt der Kalender leer.',
  },
};
