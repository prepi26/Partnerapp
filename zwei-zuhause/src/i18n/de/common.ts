/** Allgemeine Texte, Datumsangaben und Fehlermeldungen. */
export const common = {
  cancel: 'Abbrechen',
  ok: 'OK',
  save: 'Speichern',
  saving: 'Speichere…',
  sending: 'Sende…',
  delete: 'Löschen',
  done: 'Fertig',
  you: 'du',
  youCap: 'Du',
  theChild: 'Das Kind',
  failed: 'Das hat nicht geklappt',
  restartTitle: 'Bitte App neu starten',
  restartText: 'Damit die Schreibrichtung wechselt, schließe die App einmal ganz und öffne sie wieder.',
  dates: {
    months: [
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember',
    ],
    /** Sonntag zuerst (wie Date.getDay()). */
    weekdays: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    /** Montag zuerst – Kalenderkopf. */
    weekdaysShort: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
    /** {d} Tag, {month} Monatsname, {y} Jahr */
    long: '{d}. {month} {y}',
    /** {d} Tag, {mon} Monat kurz (erste 3 Buchstaben) */
    short: '{d}. {mon}',
    /** {weekday}, {d}, {month} */
    weekday: '{weekday}, {d}. {month}',
    today: 'heute',
    tomorrow: 'morgen',
    inDays: 'in {n} Tagen',
    /** Uhrzeit-Anhängsel, z. B. „17:00 Uhr“ */
    clock: '{time} Uhr',
  },
  errors: {
    invalid_code: 'Dieser Code passt nicht oder wurde schon benutzt.',
    too_many_attempts: 'Zu viele Versuche. Bitte warte eine Stunde und prüfe den Code.',
    already_in_family: 'Du bist schon mit einer Familie verbunden.',
    not_authenticated: 'Bitte melde dich erneut an.',
    not_allowed: 'Das geht nicht mehr – vermutlich wurde es schon beantwortet.',
    is_professional: 'Dieses Konto ist ein Fachkraft-Zugang. Für die eigene Familie brauchst du ein eigenes Konto.',
    is_parent: 'Dieses Konto gehört zu einer Familie. Für den Fachkraft-Zugang brauchst du ein eigenes Konto.',
    network: 'Keine Verbindung zum Server. Bist du online?',
    already_redeemed: 'Eure Familie hat schon einen Gutscheincode eingelöst.',
  },
  subscription: {
    /** Fehlermeldung, wenn nach der Testzeit ohne Abo geschrieben wird */
    required: 'Die kostenlose Testzeit ist vorbei. Mit einem Abo könnt ihr beide wieder alles eintragen.',
    readOnlyTitle: 'Nur noch lesen',
    /** {name} anderer Elternteil */
    readOnlyText:
      'Die kostenlose Testzeit ist vorbei. Mit einem Abo für die ganze Familie können du und {name} wieder alles eintragen. Lesen und Exportieren geht weiterhin.',
    cta: 'Abo ansehen',
    trialBannerOther: 'Noch {n} Tage kostenlos testen',
    trialBannerOne: 'Noch 1 Tag kostenlos testen',
    trialBannerLast: 'Letzter Tag der kostenlosen Testzeit',
    /** Gutschein, kurz vor Ende. {n} Tage */
    promoBanner: 'Gutschein: noch {n} Tage kostenlos',
    /** Allein, kurz vor Ende der kostenlosen Zeit. {n} Tage, {name} anderer Elternteil */
    soloBanner: 'Noch {n} Tage kostenlos allein – lade {name} ein, dann starten eure 14 Testtage.',
  },
  language: {
    title: 'Sprache',
    hint: 'Berichte als PDF bleiben auf Deutsch – sie sind für deutsche Ämter und Beratungsstellen.',
  },
};
