/** Texte: Einstellungen, Konto & Daten, Hilfe, Bildschirmtitel. */
export const settings = {
  /** Bildschirmtitel im Root-Layout. */
  titles: {
    changeNew: 'Tag tauschen',
    expenseNew: 'Neue Ausgabe',
    expense: 'Ausgabe',
    journalNew: 'Neuer Eintrag',
    schedule: 'Umgangsplan',
    report: 'Bericht als PDF',
    journal: 'Tagebuch 🔒',
    decisions: 'Entscheidungen',
    decisionNew: 'Neue Frage',
    handovers: 'Übergaben',
    handoverNew: 'Übergabe eintragen',
    childInfo: 'Infos zum Kind',
    childInfoEdit: 'Info',
    agreement: 'Elternvereinbarung',
    agreementEdit: 'Vereinbarung bearbeiten',
    professionals: 'Fachkräfte',
    help: 'Hilfe & Beratung',
    account: 'Konto & Daten',
    documents: 'Dokumente',
    documentNew: 'Dokument teilen',
    settings: 'Einstellungen',
    plus: 'Zwei Zuhause Plus',
  },
  root: {
    offlineTitle: 'Keine Verbindung',
    offlineText: 'Eure Daten liegen auf dem Server. Prüf deine Internetverbindung.',
    retry: 'Nochmal versuchen',
    notConfiguredTitle: 'Server fehlt noch',
    notConfiguredText: 'Trage die Supabase-Adresse und den anon-Key in die Datei .env ein (siehe SETUP.md).',
  },
  settings: {
    noLockTitle: 'Keine Gerätesperre',
    noLockText: 'Richte zuerst einen Code, Face ID oder Fingerabdruck auf deinem Handy ein.',
    logoutTitle: 'Abmelden?',
    logoutText: 'Deine Daten bleiben gespeichert.',
    logout: 'Abmelden',
    deleteTitle: 'Konto endgültig löschen?',
    /** {name} = anderer Elternteil */
    deleteTextJoined:
      'Dein Konto und dein Tagebuch werden gelöscht. Kalender, Kosten und Nachrichten bleiben für {name} erhalten – sie sind auch seine/ihre Dokumentation.',
    deleteTextAlone: 'Dein Konto, dein Tagebuch und alle Daten der Familie werden gelöscht.',
    deleteConfirm: 'Endgültig löschen',
    plusActive: 'Plus ist aktiv ✓',
    plus: 'Zwei Zuhause Plus',
    parent1: 'Elternteil 1',
    parent2: 'Elternteil 2',
    children: 'Kind / Kinder',
    childrenPlaceholder: 'z. B. Mia, Paul',
    myShare: 'Mein üblicher Anteil an Kosten',
    shareNote: 'Vorschlag beim Eintragen – pro Ausgabe änderbar.',
    changeSchedule: 'Umgangsplan ändern',
    readReceipts: 'Lesebestätigungen',
    /** {name} = anderer Elternteil */
    readReceiptsText:
      'Zeigt, wann eine Nachricht gelesen wurde. Schaltest du sie aus, sieht {name} nicht, ob du gelesen hast – und du siehst es bei {name} auch nicht.',
    appLock: 'App-Sperre',
    appLockText: 'Face ID, Fingerabdruck oder Gerätecode beim Öffnen – damit niemand sonst Nachrichten oder Tagebuch sieht.',
    reminder: 'Erinnerung vor der Übergabe',
    reminderText: 'Am Vorabend um 19 Uhr: wer das Kind bekommt, wann und wo.',
    disclaimer:
      'Zwei Zuhause ersetzt keine Rechtsberatung. Bei Fragen zu Umgang, Sorgerecht oder Unterhalt helfen Jugendamt, Beratungsstellen und Fachanwälte für Familienrecht.',
    privacy: 'Datenschutz',
    terms: 'Nutzungsbedingungen & Impressum',
    account: 'Konto & Daten',
    intro: 'Einführung ansehen',
    deleteAccount: 'Konto löschen',
  },
  account: {
    emailNotChanged: 'E-Mail nicht geändert',
    almostDone: 'Fast geschafft',
    /** {email} = neue Adresse */
    confirmSent: 'Wir haben eine Bestätigung an {email} geschickt. Erst nach dem Klick auf den Link gilt die neue Adresse.',
    passwordNotChanged: 'Passwort nicht geändert',
    passwordChanged: 'Passwort geändert',
    passwordChangedText: 'Ab jetzt meldest du dich mit dem neuen Passwort an.',
    exportFailed: 'Export fehlgeschlagen',
    emailTitle: 'E-Mail-Adresse',
    /** {email} = aktuelle Adresse */
    current: 'Aktuell: {email}',
    newEmail: 'Neue E-Mail',
    emailPlaceholder: 'name@beispiel.de',
    changeEmail: 'E-Mail ändern',
    passwordTitle: 'Passwort',
    /** {n} = Mindestlänge */
    newPassword: 'Neues Passwort (mind. {n} Zeichen)',
    changePassword: 'Passwort ändern',
    myData: 'Meine Daten',
    myDataText:
      'Alles, was du in Zwei Zuhause sehen kannst – Kalender, Kosten, Nachrichten, Entscheidungen, Vereinbarung, Infos, Dokumentenliste und dein Tagebuch – als Datei (JSON). Das ist deine Auskunft nach DSGVO.',
    creatingFile: 'Erstelle Datei…',
    exportData: 'Daten exportieren',
    /** Titel des Teilen-Dialogs beim Export */
    shareTitle: 'Meine Daten',
  },
  help: {
    urgent: {
      emergency: { label: 'Notruf', text: 'Bei akuter Gefahr für dich oder dein Kind' },
      women: { label: 'Hilfetelefon Gewalt gegen Frauen', text: 'Rund um die Uhr, anonym, mehrsprachig' },
      men: { label: 'Hilfetelefon Gewalt an Männern', text: 'Beratung für betroffene Männer' },
      kids: { label: 'Nummer gegen Kummer – Kinder & Jugendliche', text: 'Für Kinder und Jugendliche, anonym' },
      parents: { label: 'Elterntelefon', text: 'Kostenlose, anonyme Beratung für Eltern' },
    },
    places: {
      youthOffice: {
        title: 'Jugendamt',
        text: 'Berät kostenlos bei Trennung, Sorge und Umgang (§§ 17, 18 SGB VIII), hilft bei einer Elternvereinbarung und vermittelt begleiteten Umgang. Zuständig ist das Jugendamt am Wohnort des Kindes.',
      },
      counseling: {
        title: 'Erziehungs- und Familienberatung',
        text: 'Kostenlos und vertraulich, auch online – für Eltern und Kinder.',
      },
      mediation: {
        title: 'Mediation',
        text: 'Eine neutrale Person hilft euch, selbst eine Lösung zu finden. Oft schneller und günstiger als ein Gerichtsverfahren.',
      },
      lawyer: {
        title: 'Fachanwalt für Familienrecht',
        text: 'Für Fragen zu Sorgerecht, Umgang und Unterhalt im Einzelfall. Bei geringem Einkommen gibt es Beratungshilfe.',
      },
    },
    urgentTitle: 'Sofort Hilfe',
    /** {label} = Name der Hotline */
    call: '{label} anrufen',
    afraidTitle: 'Wenn du Angst vor dem anderen Elternteil hast',
    afraidTips: [
      'Deine Sicherheit geht vor. Eine gemeinsame App ist dann nicht der richtige Weg – hol dir zuerst Unterstützung (Hilfetelefon oben, rund um die Uhr).',
      'Das Jugendamt kann begleiteten Umgang oder Übergaben über Dritte organisieren. Das Familiengericht kann nach dem Gewaltschutzgesetz Kontakt- und Näherungsverbote aussprechen.',
      'Zwei Zuhause speichert keinen Standort. Lesebestätigungen kannst du in den Einstellungen ausschalten, die App-Sperre schützt Nachrichten und Tagebuch.',
      'Nachrichten lassen sich nicht löschen – auch nicht vom anderen Elternteil. Bedrohungen bleiben so dokumentiert.',
    ],
    placesTitle: 'Beratung & Begleitung',
    goodToKnowTitle: 'Gut zu wissen',
    goodToKnowTips: [
      'Euer Kind hat ein eigenes Recht auf Umgang mit beiden Eltern. Sprecht gut voneinander – Kinder hören mehr, als man denkt.',
      'Alltägliches entscheidet, wer das Kind gerade betreut. Wichtige Fragen (Schule, Operation, Auslandsreise, Umzug) entscheidet ihr bei gemeinsamer Sorge zusammen.',
      'Eine Elternvereinbarung bindet euch nur gegenseitig. Vollstreckbar wird sie erst, wenn das Familiengericht sie billigt.',
      'Nachrichten-Verläufe zeigen, wer was wann geschrieben hat – nicht, wer recht hat. Fachkräfte achten vor allem darauf, ob ihr im Sinne des Kindes kooperiert.',
    ],
    disclaimer:
      'Zwei Zuhause gibt allgemeine Informationen und ersetzt keine Rechtsberatung. Für deinen Einzelfall wende dich an das Jugendamt, eine Beratungsstelle oder eine Fachanwältin bzw. einen Fachanwalt für Familienrecht.',
  },
  dateField: {
    webPlaceholder: 'JJJJ-MM-TT',
  },
};
