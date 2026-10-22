/** Texte: family – Entscheidungen, Kind-Infos, Elternvereinbarung, Dokumente. */
export const family = {
  /** Beispiel-Hinweis unter den Kategorien; {examples} Beispiele der Kategorie */
  examples: 'z. B. {examples}',
  decisions: {
    status: {
      proposed: 'wartet auf Antwort',
      agreed: 'zugestimmt',
      rejected: 'nicht zugestimmt',
    },
    intro:
      'Über wichtige Fragen – Schule, Operation, Auslandsreise, Umzug – entscheiden Eltern mit gemeinsamer Sorge ' +
      'zusammen. Hier wird gefragt, beantwortet und festgehalten. Alltägliches entscheidet, wer das Kind gerade ' +
      'betreut.',
    emptyTitle: 'Noch nichts zu entscheiden',
    /** {name} anderer Elternteil */
    emptyText: 'Stell eine Frage an {name} – mit Frist, wenn es eilt.',
    /** {date} Datum */
    dueBy: 'Antwort erbeten bis {date}',
    yes: 'Zustimmen',
    no: 'Ablehnen',
    answerPlaceholder: 'z. B. Einverstanden, wenn …',
    withdraw: 'Zurückziehen',
    otherNotJoined: 'Antworten kann nur der andere Elternteil – sobald er/sie verbunden ist.',
    fab: 'Neue Frage',
  },
  decisionNew: {
    topic: 'Thema',
    titleLabel: 'Worum geht es?',
    titlePlaceholder: 'z. B. Klassenfahrt nach Italien im Mai',
    details: 'Details',
    detailsPlaceholder: 'Was, wann, wie viel kostet es, was spricht dafür?',
    noDue: 'Ohne Frist',
    withDue: 'Antwort bis …',
    dueLabel: 'Antwort erbeten bis',
    /** {name} anderer Elternteil */
    send: 'An {name} senden',
    tip:
      'Tipp: Schreib sachlich, was du vorschlägst und warum. Ein Vorschlag mit Begründung wird eher angenommen als ' +
      'eine Forderung.',
  },
  childInfo: {
    /** {kids} Vorname(n) oder „euer Kind“ */
    intro:
      'Alles Wichtige über {kids} an einem Ort – beide sehen und pflegen dieselben Angaben. Bei jeder ' +
      'Änderung steht, wer sie gemacht hat.',
    yourChild: 'euer Kind',
    /** {category} Bereich, z. B. „Gesundheit“ */
    add: '{category} ergänzen',
    privacy: 'Gesundheitsangaben sind besonders geschützte Daten. Trag nur ein, was ihr beide im Alltag wirklich braucht.',
    fab: 'Info hinzufügen',
  },
  childInfoEdit: {
    area: 'Bereich',
    what: 'Was?',
    whatPlaceholder: 'z. B. Kinderarzt',
    value: 'Angabe',
    valuePlaceholder: 'z. B. Dr. Weber, Hauptstr. 5, 0221 123456',
    deleteTitle: 'Eintrag löschen?',
    /** {label} Bezeichnung des Eintrags */
    deleteText: '„{label}“ wird für euch beide gelöscht.',
  },
  agreement: {
    emptyTitle: 'Eure Elternvereinbarung',
    emptyText:
      'Haltet fest, was für euch gilt: Rhythmus, Übergaben, Ferien, Kosten, Kommunikation. 17 Leitfragen helfen beim Formulieren.',
    start: 'Vereinbarung beginnen',
    /** {n} Nummer der Fassung */
    version: 'Fassung {n}',
    bothAccepted: 'Von beiden angenommen',
    waiting: 'Wartet auf Zustimmung',
    older: 'Ältere Fassung',
    /** {date} Zeitpunkt */
    acceptedAt: 'zugestimmt am {date}',
    notAccepted: 'noch nicht zugestimmt',
    /** {version} Nummer, {hash} Prüfsumme */
    hash: 'Fassung {version} · Prüfsumme {hash}',
    accept: 'Ich stimme dieser Fassung zu',
    /** {name} anderer Elternteil */
    notified: '{name} wurde benachrichtigt.',
    /** {name} anderer Elternteil */
    notJoined: 'Sobald {name} verbunden ist, kann er/sie zustimmen.',
    propose: 'Änderung vorschlagen',
    versionsNote:
      'Jede Änderung wird eine neue Fassung, der beide neu zustimmen. Ältere Fassungen bleiben unverändert erhalten.',
  },
  agreementEdit: {
    /** {name} anderer Elternteil */
    intro:
      'Schreib in eigenen Worten, was gelten soll. Leere Abschnitte bleiben einfach weg. Mit dem Speichern stimmst du ' +
      'dieser Fassung zu; {name} stimmt danach zu oder schlägt eine Änderung vor.',
    /** Erster Entwurf; {where} Zeit/Ort der Übergabe */
    handoverDraft: 'Übergabe: {where}.',
    proposeNew: 'Neue Fassung vorschlagen',
    saveAccept: 'Speichern & zustimmen',
    /** {n} ausgefüllt, {total} alle Abschnitte */
    filled: '{n} von {total} Abschnitten ausgefüllt',
  },
  documents: {
    deleteTitle: 'Dokument löschen?',
    /** {title} Titel des Dokuments */
    deleteText: '„{title}“ wird für euch beide gelöscht.',
    intro:
      'Zeugnisse, Arztbriefe, Bescheide – beide Eltern sehen dieselben Dokumente. Löschen kann nur, wer ein Dokument ' +
      'hochgeladen hat.',
    emptyTitle: 'Noch keine Dokumente',
    emptyText: 'Fotografiere ein Zeugnis oder lade ein PDF hoch – dann muss niemand mehr nach Kopien fragen.',
    /** Barrierefreiheit; {title} Titel des Dokuments */
    open: '{title} öffnen',
    /** {date} Datum des Dokuments */
    dated: 'vom {date}',
    byYou: 'von dir',
    /** {name} anderer Elternteil */
    byOther: 'von {name}',
    longPressHint: 'Eigene Dokumente: lange drücken zum Löschen.',
    fab: 'Dokument hinzufügen',
    openFailed: 'Dokument nicht geöffnet',
    notFound: 'Dokument nicht gefunden.',
  },
  documentNew: {
    tooBigTitle: 'Datei zu groß',
    /** {size} Höchstgröße, z. B. „10,0 MB“ */
    tooBigText: 'Höchstens {size} – bitte als kleineres Foto oder PDF.',
    otherFile: 'Andere Datei',
    takePhoto: 'Fotografieren',
    fromPhotos: 'Aus Fotos',
    pdfFile: 'PDF / Datei',
    titleLabel: 'Titel',
    titlePlaceholder: 'z. B. Zeugnis 2. Klasse',
    area: 'Bereich',
    noDate: 'Ohne Datum',
    withDate: 'Dokument vom …',
    dateLabel: 'Datum des Dokuments',
    /** Einwilligung nach Art. 9 DSGVO – rechtlich relevant, als Ganzes übersetzen. {name} anderer Elternteil */
    healthConsent:
      'Ich willige ein, dass dieses Gesundheitsdokument gespeichert und {name} gezeigt wird (Art. 9 DSGVO). ' +
      'Ich kann es jederzeit wieder löschen.',
    healthHint: 'Bitte nur hochladen, was ihr beide für die Betreuung wirklich braucht.',
    uploading: 'Lade hoch…',
    share: 'Teilen',
    /** {name} anderer Elternteil */
    visibleHint: '{name} sieht das Dokument sofort. Fachkräfte mit Zugang können es ebenfalls lesen.',
  },
  answerBox: {
    label: 'Deine Antwort',
    placeholder: 'Begründung (optional)',
  },
};
