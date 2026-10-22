/** Texte: Startseite, Tab-Leiste, „Mehr“ und Einladungskarte. */
export const home = {
  tabs: {
    today: 'Heute',
    calendar: 'Kalender',
    expenses: 'Kosten',
    messages: 'Nachrichten',
    more: 'Mehr',
  },
  today: {
    /** {name} eigener Name */
    hello: 'Hallo {name}',
    settings: 'Einstellungen',
    label: 'Heute',
    /** {kids} Kind(er), {who} Elternteil (farbig hervorgehoben) – ein Kind */
    kidIsWith: '{kids} ist bei {who}',
    /** {kids} Kinder, {who} Elternteil (farbig hervorgehoben) – mehrere Kinder */
    kidsAreWith: '{kids} sind bei {who}',
    /** Für {who} in „ist bei dir“ */
    withYou: 'dir',
    noSchedule: 'Noch kein Umgangsplan',
    /** {countdown} z. B. „morgen“, {weekday} Wochentag mit Datum, {where} Übergabeort mit „, “ davor oder leer, {who} Empfänger */
    nextHandover: 'Nächste Übergabe {countdown} ({weekday}{where}) an {who}',
    /** Für {who} in „an dich“ */
    toYou: 'dich',
    setSchedule: 'Umgangsplan festlegen →',
    handoverBanner: 'Übergabe gerade? Kurz festhalten, wie es lief.',
    swapRequests: 'Tauschanfragen',
    /** {n} Anzahl */
    nOpen: '{n} offen',
    noneOpen: 'Keine offen',
    messages: 'Nachrichten',
    /** {n} Anzahl ungelesener Nachrichten */
    nNew: '{n} neu',
    allRead: 'Alles gelesen',
    costs: 'Kosten',
    /** {name} anderer Elternteil */
    owesYou: '{name} schuldet dir',
    /** {name} anderer Elternteil */
    youOwe: 'Du schuldest {name}',
    /** {n} Anzahl offener Ausgaben */
    nToReview: '{n} zu prüfen',
    decisions: 'Entscheidungen',
    help: 'Hilfe & Beratung',
    footer:
      'Alles hier ist für beide gleich sichtbar – außer deinem Tagebuch. Nachrichten lassen sich nicht löschen oder ändern.',
  },
  more: {
    title: 'Mehr',
    together: 'Gemeinsam',
    onlyYou: 'Nur für dich',
    support: 'Unterstützung',
    decisions: 'Entscheidungen',
    decisionsText: 'Schule, Gesundheit, Reisen – gemeinsam klären',
    handovers: 'Übergaben',
    handoversText: 'Wie lief es? Kurz festhalten',
    childInfo: 'Infos zum Kind',
    childInfoText: 'Ärzte, Schule, Größen',
    documents: 'Dokumente',
    documentsText: 'Zeugnisse, Arztbriefe, Bescheide',
    agreement: 'Elternvereinbarung',
    agreementText: 'Eure Absprachen, von beiden angenommen',
    journal: 'Tagebuch',
    /** {n} Anzahl Einträge */
    journalTextOne: '{n} Eintrag · privat',
    /** {n} Anzahl Einträge */
    journalTextOther: '{n} Einträge · privat',
    report: 'Bericht als PDF',
    reportText: 'Für Beratung, Jugendamt oder Anwalt',
    reportPlus: 'Mit Plus',
    professionals: 'Fachkräfte',
    professionalsText: 'Jugendamt, Beratung, Verfahrensbeistand einladen',
    help: 'Hilfe & Beratung',
    helpText: 'Notfallnummern, Jugendamt, Beratungsstellen',
    settings: 'Einstellungen',
    settingsText: 'Namen, Kosten-Anteil, Konto',
    maintenance: 'Unterhalt',
    maintenanceText: 'Vereinbart und gezahlt – Monat für Monat',
    packing: 'Packliste',
    packingText: 'Was zur nächsten Übergabe mit muss',
    holidays: 'Schulferien',
    holidaysText: 'Ferien im Kalender, Aufteilung absprechen',
    plus: 'Abo & Gutschein',
    plusText: 'Testzeit, Familien-Abo, Gutscheincode',
    calendarSync: 'Im Handy-Kalender',
    calendarSyncText: 'Umgangsplan in iPhone-, Google- oder Outlook-Kalender',
  },
  invite: {
    /** {code} Einladungscode */
    shareMessage:
      'Ich nutze „Zwei Zuhause“ für Umgang, Kosten und Absprachen. Lade dir die App, erstelle ein Konto und gib diesen Code ein: {code}',
    /** {name} anderer Elternteil */
    title: '{name} ist noch nicht verbunden',
    /** {name} anderer Elternteil */
    text: 'Mit diesem Code sieht {name} denselben Kalender und dieselben Kosten und kann dir schreiben. Bis dahin kannst du alles allein nutzen.',
    share: 'Code teilen',
    /** {name} anderer Elternteil */
    solo: 'Die 14 kostenlosen Testtage starten erst, wenn {name} dabei ist.',
  },
};
