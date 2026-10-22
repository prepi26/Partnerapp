/** Texte: Nachrichten und privates Protokoll. */
export const messages = {
  chat: {
    title: 'Nachrichten',
    /** Untertitel im Kopf, {name} = anderer Elternteil */
    subtitle: 'mit {name} · nicht löschbar',
    help: 'Hilfe & Beratung',
    toneTitle: 'Nochmal lesen?',
    toneNote: 'Nachrichten lassen sich später nicht mehr ändern.',
    toneRevise: 'Überarbeiten',
    toneSendAnyway: 'Trotzdem senden',
    notSent: 'Nicht gesendet',
    emptyTitle: 'Sachlich bleiben',
    emptyText:
      'Jede Nachricht wird mit Datum, Uhrzeit und Prüfsumme gespeichert und kann nicht gelöscht werden. Das schützt euch beide.',
    emptyWaiting: 'Sobald {name} verbunden ist, könnt ihr hier schreiben.',
    placeholder: 'Nachricht schreiben…',
    notConnected: '{name} ist noch nicht verbunden',
    send: 'Senden',
    /** Unter der eigenen Nachricht, {time} = Zeitpunkt des Lesens */
    read: 'gelesen {time}',
    delivered: 'zugestellt',
  },
  journal: {
    deleteTitle: 'Eintrag löschen?',
    deleteText: 'Der Eintrag wird endgültig gelöscht.',
    intro:
      'Halte fest, was passiert ist: Übergaben, Absagen, Stimmung des Kindes. Sachlich, mit Datum – das hilft im Gespräch mit Jugendamt, Beratung oder Anwalt.',
    emptyTitle: 'Dein privates Protokoll',
    emptyText:
      'Was du hier schreibst, sieht der andere Elternteil nie. Mit Plus kannst du es als PDF für Beratung oder Anwalt exportieren.',
    /** {time} = Zeitpunkt des Notierens */
    meta: 'Notiert am {time} · lange drücken zum Löschen',
    add: 'Neuer Eintrag',
  },
  journalNew: {
    when: 'Wann war es?',
    what: 'Was ist passiert?',
    placeholder: 'z. B. Übergabe 30 Minuten zu spät, Mia war danach sehr still.',
    tip: 'Tipp: Beschreibe, was du gesehen und gehört hast – nicht, was du vermutest. Das macht deine Notizen glaubwürdig.',
  },
};
