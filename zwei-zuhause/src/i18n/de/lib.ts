/** Texte zu festen Auswahllisten (Umgangsmodelle, Kategorien, Vereinbarung …). Die Schlüssel stehen im Code. */
export const lib = {
  models: {
    wechsel_7_7: { title: 'Wechselmodell 7/7', text: 'Eine Woche hier, eine Woche dort.' },
    wechsel_2_2_5_5: { title: 'Wechselmodell 2-2-5-5', text: 'Feste Wochentage plus Wochenenden im Wechsel.' },
    wechsel_2_2_3: { title: 'Wechselmodell 2-2-3', text: 'Kurze Abstände – gut für kleine Kinder.' },
    wechsel_3_4_4_3: { title: 'Wechselmodell 3-4-4-3', text: 'Drei Tage hier, vier dort – in der Woche darauf umgekehrt.' },
    wechsel_14_14: { title: 'Zwei Wochen im Wechsel', text: 'Zwei Wochen hier, zwei Wochen dort – z. B. bei weiten Wegen.' },
    residenz_we: {
      title: 'Residenzmodell',
      text: 'Das Kind lebt überwiegend bei einem, jedes zweite Wochenende (Fr–So) beim anderen.',
    },
    custom: {
      title: 'Eigener Rhythmus',
      text: 'Ihr legt für 1 bis 4 Wochen fest, wer an welchem Tag dran ist – danach wiederholt es sich.',
    },
    none: { title: 'Kein fester Plan', text: 'Ihr tragt jeden Tag einzeln ein.' },
  },
  expenseCategories: {
    kleidung: 'Kleidung',
    schule: 'Schule & Kita',
    gesundheit: 'Gesundheit',
    freizeit: 'Hobby & Verein',
    urlaub: 'Ferien & Ausflüge',
    betreuung: 'Betreuung',
    sonstiges: 'Sonstiges',
  },
  needs: {
    regular: {
      label: 'Laufend',
      text: 'Alltägliches, das eigentlich der Unterhalt abdeckt – z. B. Kleidung, Schulsachen.',
    },
    mehrbedarf: {
      label: 'Mehrbedarf',
      text: 'Regelmäßig und vorhersehbar, zusätzlich zum Unterhalt – z. B. Kita-Beitrag, Nachhilfe, Zahnspange.',
    },
    sonderbedarf: {
      label: 'Sonderbedarf',
      text: 'Unvorhersehbar und außergewöhnlich hoch – z. B. kurzfristige Behandlung. Zeitnah ansprechen: Der Anspruch ist befristet.',
    },
  },
  decisionCategories: {
    schule: { label: 'Schule & Kita', examples: 'Schulwahl, Schulwechsel, Kita-Platz, Förderschule' },
    gesundheit: { label: 'Gesundheit', examples: 'Operation, Impfungen, Therapie, Zahnspange' },
    reise: { label: 'Reisen', examples: 'Auslandsreise, Fernreise, Schüleraustausch, Reisepass' },
    wohnort: { label: 'Wohnort', examples: 'Umzug, Wechsel des Lebensmittelpunkts' },
    religion: { label: 'Religion & Name', examples: 'Taufe, Religionsunterricht, Namensänderung' },
    freizeit: { label: 'Freizeit', examples: 'Verein, Instrument, Handy, Ferienlager' },
    sonstiges: { label: 'Sonstiges', examples: '' },
  },
  infoCategories: {
    gesundheit: {
      label: 'Gesundheit',
      suggestions: ['Kinderarzt', 'Zahnarzt', 'Krankenkasse', 'Allergien', 'Medikamente', 'Impfungen', 'Blutgruppe'],
    },
    schule: {
      label: 'Schule & Kita',
      suggestions: ['Schule / Kita', 'Klasse / Gruppe', 'Klassenlehrer:in', 'Schulzeiten', 'Hort / Betreuung'],
    },
    groessen: { label: 'Größen', suggestions: ['Kleidergröße', 'Schuhgröße', 'Körpergröße'] },
    dokumente: {
      label: 'Dokumente',
      suggestions: ['Kinderreisepass', 'Personalausweis', 'Steuer-ID', 'Krankenversicherungskarte'],
    },
    kontakte: { label: 'Kontakte', suggestions: ['Großeltern', 'Babysitter', 'Trainer:in', 'Beste Freundin / bester Freund'] },
    alltag: { label: 'Alltag', suggestions: ['Schlafenszeit', 'Lieblingsessen', 'Kuscheltier', 'Medienzeit', 'Hobbys'] },
    sonstiges: { label: 'Sonstiges', suggestions: [] as string[] },
  },
  documentCategories: {
    schule: { label: 'Schule & Kita', examples: 'Zeugnis, Elternbrief, Kita-Vertrag, Stundenplan' },
    gesundheit: { label: 'Gesundheit', examples: 'Arztbrief, Impfpass, Befund, Rezept' },
    behoerde: { label: 'Ämter & Ausweise', examples: 'Kinderausweis, Bescheid, Vollmacht, Geburtsurkunde' },
    sonstiges: { label: 'Sonstiges', examples: 'Vereinsanmeldung, Versicherung' },
  },
  agreementSections: {
    betreuung: {
      title: 'Betreuungsmodell & Rhythmus',
      questions: 'Wechsel- oder Residenzmodell? Welche Tage bei wem, ab wann gilt der Plan?',
    },
    uebergabe: {
      title: 'Übergaben',
      questions: 'Wo und wann? Wer bringt, wer holt? Wie viel Verspätung ist okay, wie sagt man Bescheid?',
    },
    ferien: {
      title: 'Ferien',
      questions: 'Wie werden Schulferien aufgeteilt? Bis wann wird geplant (z. B. Sommerferien bis 31. Januar)?',
    },
    feiertage: {
      title: 'Feiertage & Geburtstage',
      questions: 'Weihnachten, Ostern, Silvester, Geburtstage des Kindes und der Eltern – jährlich im Wechsel?',
    },
    ausfall: {
      title: 'Krankheit & Ausfall',
      questions: 'Was passiert, wenn das Kind krank ist oder ein Termin ausfällt? Wird nachgeholt? Absagefrist?',
    },
    tausch: { title: 'Tausch & Änderungen', questions: 'Wie fragt man nach einem Tausch, und bis wann wird geantwortet?' },
    kommunikation: {
      title: 'Kommunikation',
      questions: 'Über welchen Weg (z. B. diese App)? Antwort innerhalb von …? Keine Botschaften über das Kind.',
    },
    kontakt: {
      title: 'Kontakt zum Kind',
      questions: 'Telefon- oder Videoanrufe, während das Kind beim anderen ist – wann und wie oft?',
    },
    entscheidungen: {
      title: 'Entscheidungen',
      questions: 'Was entscheidet, wer gerade betreut? Was entscheiden wir gemeinsam (Schule, Gesundheit, Reisen)?',
    },
    informationen: {
      title: 'Informationen',
      questions: 'Wie teilen wir Zeugnisse, Arzttermine, Elternabende? Wer ist bei Schule und Kita eingetragen?',
    },
    reisen: {
      title: 'Reisen & Ausweise',
      questions: 'Wer verwahrt den Kinderreisepass? Wie weit vorher wird eine Reise angekündigt?',
    },
    kosten: {
      title: 'Kosten',
      questions: 'Unterhalt, Kindergeld, Aufteilung von Extras (Verein, Klassenfahrt, Zahnspange), Taschengeld.',
    },
    sachen: {
      title: 'Sachen des Kindes',
      questions: 'Was wechselt mit (Kleidung, Medikamente, Schulsachen, Kuscheltier), was bleibt?',
    },
    dritte: {
      title: 'Neue Partner & Familie',
      questions: 'Wie gehen wir mit neuen Partnern um? Kontakt zu Großeltern und Verwandten?',
    },
    umzug: { title: 'Umzug', questions: 'Wie früh kündigen wir einen Umzug an?' },
    konflikte: {
      title: 'Wenn wir uneins sind',
      questions: 'Erst Gespräch, dann Beratungsstelle oder Jugendamt, dann Mediation?',
    },
    ueberpruefung: { title: 'Überprüfung', questions: 'Wann schauen wir wieder drauf – jährlich, beim Schulwechsel?' },
  },
  agreementNote:
    'Diese Vereinbarung ist eine Absprache zwischen den Eltern. Ohne gerichtliche Billigung ist sie nicht vollstreckbar. ' +
    'Jugendamt und Beratungsstellen helfen kostenlos dabei, sie zu erarbeiten.',
  handoverStatus: {
    on_time: 'Pünktlich',
    late: 'Verspätet',
    missed: 'Ausgefallen',
    /** Minuten-Anhängsel bei Verspätung */
    minutes: '{n} Min.',
  },
  tone: {
    always: '„Immer“ und „nie“ klingen nach Vorwurf. Ein konkreter Fall wirkt sachlicher.',
    insult: 'Abwertende Wörter tauchen später in jedem Bericht auf – auch beim Jugendamt.',
    threat: 'Drohungen verhärten Fronten. Schreib lieber, was du dir wünschst.',
    punctuation: 'Mehrere Ausrufe- oder Fragezeichen wirken laut.',
    caps: 'Großbuchstaben lesen sich wie Schreien.',
  },
  reminder: {
    title: 'Morgen ist Übergabe',
    /** {kids} Vorname(n), {to} Ziel („zu dir“/„zu Thomas“), {where} Zeit/Ort mit führendem „ · “ oder leer */
    body: '{kids}: Wechsel {to}{where}',
    toYou: 'zu dir',
    toOther: 'zu {name}',
  },
  /** Push-Mitteilungen – der Server setzt {name} (Absender), {label} bzw. {title} ein. Bewusst ohne Inhalte. */
  push: {
    tapToOpen: 'Tipp hier, um es anzusehen.',
    messageTitle: '💬 Neue Nachricht von {name}',
    messageBody: 'Tipp hier, um sie zu lesen.',
    changeNew: '📅 {name} schlägt eine Änderung im Umgang vor',
    changeAccepted: '✅ {name} hat deinem Vorschlag zugestimmt',
    changeDeclined: '❌ {name} hat deinen Vorschlag abgelehnt',
    expenseNew: '💶 {name} hat eine Ausgabe eingetragen',
    expenseNewBody: 'Bitte prüfen und bestätigen.',
    expenseConfirmed: '✅ {name} hat eine Ausgabe bestätigt',
    expenseDisputed: '❌ {name} hat eine Ausgabe abgelehnt',
    decisionNew: '🤝 {name} bittet um eine Entscheidung',
    decisionAgreed: '✅ {name} hat zugestimmt',
    decisionRejected: '❌ {name} hat nicht zugestimmt',
    handoverNew: '🚗 {name} hat eine Übergabe eingetragen',
    handoverReply: '🚗 {name} hat auf deinen Übergabe-Eintrag geantwortet',
    agreementNew: '📝 {name} hat die Elternvereinbarung bearbeitet',
    agreementNewBody: 'Lies die neue Fassung und stimme zu, wenn sie für dich passt.',
    agreementAccepted: '📝 {name} hat der Elternvereinbarung zugestimmt',
    professionalInvite: '🔐 {name} möchte eine Fachkraft einladen',
    professionalInviteBody: '{label} – bitte zustimmen oder ablehnen.',
    documentNew: '📄 {name} hat ein Dokument geteilt',
    documentNewBody: '{title}',
    maintenanceNew: '💶 {name} hat eine Unterhaltszahlung eingetragen',
    maintenanceNewBody: 'Tipp hier, um sie anzusehen.',
    maintenanceConfirmed: '✅ {name} hat den Erhalt bestätigt',
    maintenanceDisputed: '❌ {name} hat den Erhalt nicht bestätigt',
    /** Kalender-Abo: Eintrag für einen Zeitraum. {children} Kinder, {name} Elternteil */
    calStay: '{children} bei {name}',
    /** Kalender-Abo: Übergabe. {children} Kinder, {name} Elternteil, zu dem das Kind geht */
    calHandover: 'Übergabe: {children} zu {name}',
    /** Kalender-Abo: Ersatz, wenn keine Kindernamen eingetragen sind */
    calChild: 'Kind',
    /** Ersatzname, falls kein Name eingetragen ist */
    otherParent: 'Der andere Elternteil',
  },
};
