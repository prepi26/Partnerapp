/** Texte: Kosten, Ausgaben und Plus. */
export const money = {
  list: {
    title: 'Kosten',
    subtitle: 'Ausgaben fürs Kind teilen',
    even: 'Ihr seid quitt',
    /** {name} anderer Elternteil */
    owesYou: '{name} schuldet dir',
    /** {name} anderer Elternteil */
    youOwe: 'Du schuldest {name}',
    /** {n} Anzahl offener Einträge (mit Leerzeichen am Ende, es folgt ignoredHint) */
    openOne: 'Davon {n} noch nicht bestätigt. ',
    openOther: 'Davon {n} noch nicht bestätigt. ',
    ignoredHint: 'Abgelehnte Einträge zählen nicht.',
    emptyTitle: 'Noch keine Ausgaben',
    emptyText: 'Trag ein, was du fürs Kind bezahlt hast – Schuhe, Klassenfahrt, Kita. Der Saldo rechnet sich selbst.',
    add: 'Neue Ausgabe',
    paymentMe: 'Du hast ausgeglichen',
    /** {name} anderer Elternteil */
    paymentOther: '{name} hat ausgeglichen',
    paidMe: 'Du hast bezahlt',
    /** {name} anderer Elternteil */
    paidOther: '{name} hat bezahlt',
    /** {amount} Betrag */
    yourShare: 'dein Anteil {amount}',
  },
  status: {
    confirmed: 'bestätigt',
    disputed: 'abgelehnt',
    waiting: 'wartet auf Bestätigung',
    check: 'bitte prüfen',
  },
  detail: {
    notFoundTitle: 'Nicht gefunden',
    notFoundText: 'Dieser Eintrag existiert nicht mehr.',
    deleteTitle: 'Eintrag löschen?',
    deleteText: 'Der Eintrag und sein Beleg werden gelöscht.',
    date: 'Datum',
    payment: 'Ausgleich',
    category: 'Kategorie',
    need: 'Art',
    paidBy: 'Bezahlt von',
    /** {name} Elternteil */
    shareOf: 'Anteil {name}',
    created: 'Eingetragen',
    answered: 'Beantwortet',
    confirm: 'Bestätigen',
    reject: 'Ablehnen',
    deleteButton: 'Eintrag löschen',
    disputedHint: 'Abgelehnt – klärt den Punkt am besten per Nachricht. Der Betrag zählt nicht im Saldo.',
  },
  new: {
    /** Standard-Titel, wenn nichts eingetragen wurde */
    defaultPayment: 'Ausgleichszahlung',
    defaultExpense: 'Ausgabe',
    kindExpense: 'Ausgabe',
    kindPayment: 'Ausgleichszahlung',
    amount: 'Betrag in €',
    amountPlaceholder: '0,00',
    note: 'Notiz (optional)',
    what: 'Wofür?',
    notePlaceholder: 'z. B. Überweisung Oktober',
    whatPlaceholder: 'z. B. Winterjacke',
    date: 'Datum',
    whoPaidPayment: 'Wer hat gezahlt?',
    whoPaidExpense: 'Wer hat bezahlt?',
    me: 'Ich',
    /** {name} anderer Elternteil, {amount} Betrag */
    paymentHintMe: 'Du hast {name} {amount} gezahlt, um den Saldo auszugleichen.',
    /** {name} anderer Elternteil */
    paymentHintMeNoAmount: 'Du hast {name} den Betrag gezahlt, um den Saldo auszugleichen.',
    /** {name} anderer Elternteil, {amount} Betrag */
    paymentHintOther: '{name} hat dir {amount} gezahlt, um den Saldo auszugleichen.',
    /** {name} anderer Elternteil */
    paymentHintOtherNoAmount: '{name} hat dir den Betrag gezahlt, um den Saldo auszugleichen.',
    myShare: 'Mein Anteil',
    /** {mine} mein Betrag, {name} anderer Elternteil, {theirs} dessen Betrag */
    shareHint: 'Du trägst {mine}, {name} {theirs}.',
    shareDefaultHint: 'Den Standard-Anteil stellst du in den Einstellungen ein.',
    category: 'Kategorie',
    need: 'Art der Ausgabe',
    receipt: 'Beleg',
    receiptPlus: 'Beleg (Plus)',
    removeReceipt: 'Beleg entfernen',
    tapToRemove: 'Tippen zum Entfernen',
    takePhoto: 'Foto machen',
    fromPhotos: 'Aus Fotos',
    /** {name} anderer Elternteil */
    confirmHint: '{name} kann den Eintrag bestätigen oder ablehnen. Bestätigte Einträge lassen sich nicht mehr löschen.',
    /** {name} anderer Elternteil */
    notJoinedHint: 'Sobald {name} verbunden ist, kann er/sie deine Einträge bestätigen.',
  },
  plus: {
    benefits: {
      reportsTitle: 'Berichte als PDF',
      reportsText: 'Umgang, Kosten, Nachrichten und Tagebuch – fertig für Jugendamt, Beratung oder Anwalt.',
      receiptsTitle: 'Belege fotografieren',
      receiptsText: 'Kassenbon zur Ausgabe – nie wieder „Das hast du nie bezahlt“.',
      proofTitle: 'Nachweise, die halten',
      proofText: 'Mit Datum, Uhrzeit und Prüfsumme zu jedem Eintrag.',
      supportTitle: 'Unterstützt Zwei Zuhause',
      supportText: 'Keine Werbung, keine verkauften Daten. Server in der EU.',
    },
    period: {
      annual: 'Jährlich',
      monthly: 'Monatlich',
      lifetime: 'Einmalig, für immer',
    },
    /** {price} Preis pro Monat */
    perMonth: 'nur {price} / Monat',
    /** Testzeitraum: {n} Anzahl */
    trial: {
      dayOne: '{n} Tag gratis testen',
      dayOther: '{n} Tage gratis testen',
      weekOne: '{n} Woche gratis testen',
      weekOther: '{n} Wochen gratis testen',
      monthOne: '{n} Monat gratis testen',
      monthOther: '{n} Monate gratis testen',
      yearOne: '{n} Jahr gratis testen',
      yearOther: '{n} Jahre gratis testen',
      /** Unbekannte Einheit: {n} Anzahl, {unit} Einheit (Code aus dem Store) */
      fallback: '{n} {unit} gratis testen',
    },
    /** {price} Einführungspreis */
    introPrice: 'Erst {price}',
    nothingFound: 'Nichts gefunden',
    heroTitle: 'Zwei Zuhause Plus',
    heroText: 'Kalender, Kosten und Nachrichten bleiben kostenlos. Plus ist für alles, was du belegen musst.',
    activeTitle: 'Plus ist aktiv ✓',
    activeText: 'Verwalten oder kündigen kannst du dein Abo in den Einstellungen deines Handys.',
    unavailable: 'Käufe sind nur in der iOS- und Android-App möglich.',
    busy: 'Einen Moment…',
    unlock: 'Plus freischalten',
    terms:
      'Das Abo gilt nur für dich, nicht für den anderen Elternteil. Es verlängert sich automatisch, bis du es mindestens 24 Stunden vor Ablauf in den Einstellungen von App Store bzw. Google Play kündigst.',
    noPurchase: 'Zu deinem Konto gibt es keinen aktiven Kauf.',
    restore: 'Käufe wiederherstellen',
    termsLink: 'Nutzungsbedingungen',
    privacyLink: 'Datenschutz',
  },
};
