/** Texte: Fachkraft-Zugang (Eltern- und Fachkraft-Seite) und Berichte. */
export const pro = {
  /** Zeiträume für Berichte (Schlüssel = RANGES.key). */
  ranges: {
    '30': '30 Tage',
    '90': '3 Monate',
    '365': '12 Monate',
  },
  shareDialogTitle: 'Bericht teilen',
  pdfFailed: 'PDF nicht erstellt',
  professionals: {
    durations: {
      weeks2: '2 Wochen',
      month1: '1 Monat',
      months3: '3 Monate',
      months6: '6 Monate',
    },
    /** {date} Zeitpunkt des Widerrufs */
    revokedAt: 'Widerrufen am {date}',
    expired: 'Abgelaufen',
    awaitingApproval: 'Wartet auf Zustimmung',
    codeNotRedeemed: 'Code noch nicht eingelöst',
    /** {date} Ablaufdatum */
    activeUntil: 'Aktiv bis {date}',
    /** {code} Einladungscode */
    shareMessage:
      'Zugang zu unserer Familie in „Zwei Zuhause“ (nur lesen, ohne mein privates Tagebuch): ' +
      'App laden, Konto erstellen, „Ich bin Fachkraft“ wählen und diesen Code eingeben: {code}',
    revokeTitle: 'Zugang widerrufen?',
    /** {label} Name der Fachkraft */
    revokeText: '{label} sieht danach nichts mehr.',
    revoke: 'Widerrufen',
    intro:
      'Jugendamt, Beratungsstelle, Mediation, Verfahrensbeistand oder Anwalt können eure Familie lesen – Kalender, ' +
      'Übergaben, Kosten, Entscheidungen, Vereinbarung und Nachrichten. Euer privates Tagebuch nie.',
    /** {name} anderer Elternteil */
    introOtherMustApprove: '{name} muss jedem Zugang zustimmen.',
    introBothCanRevoke: 'Beide können jederzeit widerrufen.',
    whoLabel: 'Wer bekommt Zugang?',
    whoPlaceholder: 'z. B. Jugendamt Köln, Frau Schmidt',
    howLong: 'Für wie lange?',
    creatingCode: 'Erstelle Code…',
    createCode: 'Code erstellen & teilen',
    /** {date} Zeitpunkt der Einladung */
    invitedByMe: 'Eingeladen von dir am {date}',
    /** {name} einladender Elternteil, {date} Zeitpunkt der Einladung */
    invitedBy: 'Eingeladen von {name} am {date}',
    /** {date} Zeitpunkt des Einlösens */
    redeemed: 'eingelöst {date}',
    /** {code} Einladungscode */
    code: 'Code: {code}',
    approve: 'Zustimmen',
    decline: 'Ablehnen',
  },
  cases: {
    joinFailed: 'Code nicht eingelöst',
    title: 'Fachkraft-Zugang',
    subtitle: 'Nur lesen · von den Eltern freigegeben',
    refresh: 'Aktualisieren',
    family: 'Familie',
    accessRevoked: 'Zugang widerrufen',
    accessExpired: 'Zugang abgelaufen',
    /** {date} Ablaufdatum */
    sharedUntil: 'Freigegeben bis {date}',
    awaitingOtherParent: 'Wartet auf Zustimmung des zweiten Elternteils',
    addFamily: 'Weitere Familie hinzufügen',
    codeLabel: 'Code von den Eltern',
    codePlaceholder: '8 Zeichen',
    checking: 'Prüfe…',
    redeem: 'Code einlösen',
    note:
      'Sie sehen Kalender, Übergaben, Kosten, Entscheidungen, Elternvereinbarung, Kind-Infos und Nachrichten – nie die ' +
      'privaten Tagebücher. Die Eltern sehen, dass und wann Sie Zugang haben, und können ihn jederzeit widerrufen. Der ' +
      'Fachkraft-Zugang ist kostenlos.',
    signOut: 'Abmelden',
  },
  case: {
    noAccess: 'Kein Zugriff',
    accessInactive: 'Dieser Zugang ist nicht (mehr) aktiv.',
    reload: 'Neu laden',
    child: 'Kind',
    /** {name} Elternteil (oder „–“), {plan} Betreuungsmodell */
    todayAt: 'Heute bei {name} · {plan}',
    noPlan: 'kein Plan',
    reportPdf: 'Bericht als PDF',
    shortReport: 'Kurzbericht',
    fullReport: 'Vollständig',
    handovers: 'Übergaben',
    confirmed: 'bestätigt',
    disputed: 'widersprochen',
    noneRecorded: 'Keine erfasst.',
    decisions: 'Entscheidungen',
    decisionOpen: 'offen',
    decisionAgreed: 'zugestimmt',
    decisionRejected: 'nicht zugestimmt',
    agreement: 'Elternvereinbarung',
    /** {version} Nummer der Fassung */
    agreementVersion: 'Fassung {version}',
    acceptedByBoth: 'von beiden angenommen',
    notAcceptedByBoth: 'nicht von beiden angenommen',
    noAgreement: 'Keine Vereinbarung.',
    costs: 'Kosten',
    /** {n} Anzahl, {balance} Saldo-Text */
    costSummaryOne: '{n} Eintrag · Saldo: {balance}',
    costSummaryOther: '{n} Einträge · Saldo: {balance}',
    balanced: 'ausgeglichen',
    lastMessages: 'Letzte Nachrichten',
    noMessages: 'Keine Nachrichten.',
    fullHistoryInPdf: 'Den vollständigen Verlauf enthält der PDF-Bericht.',
    documents: 'Dokumente',
    childInfo: 'Infos zum Kind',
    endAccess: 'Zugang beenden',
  },
  report: {
    sections: {
      schedule: { title: 'Umgang', text: 'Tage je Elternteil, Tauschwünsche' },
      handovers: { title: 'Übergaben', text: 'Pünktlich, verspätet, ausgefallen' },
      decisions: { title: 'Entscheidungen', text: 'Fragen und Antworten' },
      agreement: { title: 'Elternvereinbarung', text: 'Aktuelle Fassung mit Zustimmungen' },
      expenses: { title: 'Kosten', text: 'Ausgaben, Anteile, Saldo' },
      maintenance: { title: 'Unterhalt', text: 'Vereinbart und gezahlt je Monat' },
      messages: { title: 'Nachrichten', text: 'Vollständiger Verlauf mit Prüfsummen' },
      documents: { title: 'Dokumente', text: 'Liste der geteilten Dokumente' },
      journal: { title: 'Mein Tagebuch', text: 'Nur deine eigenen Notizen' },
    },
    intro:
      'Für Beratungsstelle, Jugendamt, Mediation oder Anwalt – mit Datum und Uhrzeit zu jedem Eintrag, vollständig und ' +
      'chronologisch.',
    shortReport: 'Kurzbericht (1 Seite)',
    fullReport: 'Vollständig',
    shortHint:
      'Zahlen auf einen Blick: Betreuungstage, Übergaben, Antwortzeiten, Kosten, offene Entscheidungen. Ideal fürs Erstgespräch.',
    fullHint: 'Alle Einträge im Detail.',
    period: 'Zeitraum',
    /** {from} Startdatum, {to} Enddatum */
    fromTo: '{from} bis {to}',
    creatingPdf: 'Erstelle PDF…',
    createPdf: 'PDF erstellen',
    createPdfPlus: 'PDF erstellen (Plus)',
    footer: 'Der Bericht entsteht auf deinem Handy. Du entscheidest, an wen du ihn weitergibst.',
  },
};
