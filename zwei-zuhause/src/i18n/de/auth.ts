/** Texte: Anmeldung, Familie anlegen, Einführung, App-Sperre. */
export const auth = {
  login: {
    subtitle: 'Umgang, Kosten und Absprachen fürs Kind – sachlich, nachvollziehbar, an einem Ort.',
    newHere: 'Neu hier',
    /** Im Browser über den Fachkraft-Link geöffnet */
    proSubtitle:
      'Zugang für Fachkräfte – kostenlos und nur lesend. Erstell ein Konto mit deiner Dienst-E-Mail, danach gibst du den Code der Familie ein.',
    proIdle: 'Aus Sicherheitsgründen meldet dich der Browser nach 30 Minuten ohne Aktivität ab.',
    haveAccount: 'Ich habe ein Konto',
    forgotTitle: 'Passwort vergessen',
    email: 'Deine E-Mail',
    emailPlaceholder: 'name@beispiel.de',
    codeFromEmail: 'Code aus der E-Mail',
    /** {min} Mindestlänge des Passworts */
    newPassword: 'Neues Passwort (mind. {min} Zeichen)',
    /** {min} Mindestlänge des Passworts */
    passwordWithMin: 'Passwort (mind. {min} Zeichen)',
    password: 'Passwort',
    oneMoment: 'Einen Moment…',
    changePassword: 'Passwort ändern',
    /** {link} wird durch resendLink ersetzt (antippbar) */
    noCode: 'Kein Code da? Schau im Spam-Ordner nach oder {link}.',
    resendLink: 'schick ihn nochmal',
    sendCode: 'Code per E-Mail senden',
    sendCodeHint: 'Wir schicken dir einen Code, mit dem du ein neues Passwort festlegst.',
    backToSignIn: 'Zurück zur Anmeldung',
    createAccount: 'Konto erstellen',
    signIn: 'Anmelden',
    signupHint:
      'Jeder Elternteil hat ein eigenes Konto. Danach verbindet ihr euch mit einem Code – oder du startest erst einmal allein.',
    signinHint: 'Mit derselben E-Mail und demselben Passwort kommst du auch auf einem neuen Handy an deine Daten.',
    forgotLink: 'Passwort vergessen?',
    codeNotSent: 'Code konnte nicht gesendet werden',
    passwordNotChanged: 'Passwort nicht geändert',
    /** {error} Fehlermeldung */
    passwordNotChangedText: '{error} Du bist trotzdem angemeldet.',
    accountNotCreated: 'Konto konnte nicht erstellt werden',
    almostDone: 'Fast geschafft',
    confirmEmail: 'Bitte bestätige deine E-Mail über den Link, den du bekommen hast.',
    signInFailed: 'Anmeldung fehlgeschlagen',
    errors: {
      invalidCredentials: 'E-Mail oder Passwort stimmen nicht.',
      alreadyRegistered: 'Mit dieser E-Mail gibt es schon ein Konto. Wechsle zu „Anmelden“.',
      notConfirmed: 'Diese E-Mail ist noch nicht bestätigt.',
      badCode: 'Der Code stimmt nicht oder ist abgelaufen. Fordere einfach einen neuen an.',
      samePassword: 'Nimm ein anderes Passwort als bisher.',
      /** {min} Mindestlänge des Passworts */
      passwordTooShort: 'Das Passwort braucht mindestens {min} Zeichen.',
      tooManyAttempts: 'Zu viele Versuche. Warte kurz und probier es dann nochmal.',
    },
  },
  onboarding: {
    title: 'Eure Familie',
    subtitle:
      'Ein Elternteil legt die Familie an und bekommt einen Code für den anderen. Du kannst auch erst einmal allein starten – Kalender, Kosten und Tagebuch funktionieren sofort.',
    createFamily: 'Familie anlegen',
    haveCode: 'Ich habe einen Code',
    imProfessional: 'Ich bin Fachkraft',
    yourName: 'Dein Name',
    yourNamePlaceholder: 'z. B. Sandra',
    otherName: 'Name des anderen Elternteils',
    otherNamePlaceholder: 'z. B. Thomas',
    kids: 'Kind / Kinder (Vornamen)',
    kidsPlaceholder: 'z. B. Mia, Paul',
    creating: 'Lege an…',
    proText:
      'Für Jugendamt, Beratungsstelle, Mediation, Verfahrensbeistand oder Anwalt: Die Eltern erstellen in der App einen 8-stelligen Code für dich. Der Zugang ist kostenlos und nur lesend.',
    familyCode: 'Code der Familie',
    familyCodePlaceholder: '8 Zeichen',
    checking: 'Prüfe…',
    openAccess: 'Zugang öffnen',
    otherParentCode: 'Code vom anderen Elternteil',
    otherParentCodePlaceholder: 'z. B. KMPQXT',
    connecting: 'Verbinde…',
    connect: 'Verbinden',
    privacy: 'Nur ihr beide seht Kalender, Kosten und Nachrichten. Dein Tagebuch sieht niemand außer dir.',
    signOut: 'Abmelden',
  },
  intro: {
    skip: 'Überspringen',
    next: 'Weiter',
    start: 'Los geht’s',
    slides: [
      {
        title: 'Zwei Zuhause, ein Kind',
        text: 'Umgang, Kosten und Absprachen an einem Ort – sachlich, nachvollziehbar und für beide Eltern gleich.',
      },
      {
        title: 'Was beide sehen',
        text: 'Kalender, Kosten, Nachrichten, Entscheidungen, Übergaben und Dokumente sieht ihr beide. Dein Tagebuch sieht nur du.',
      },
      {
        title: 'Nichts verschwindet',
        text: 'Nachrichten und Übergabe-Einträge lassen sich nicht ändern oder löschen. Das schützt euch beide. Schreib so, als würde eine Beraterin mitlesen.',
      },
      {
        title: 'Hilfe, wenn es schwer wird',
        text: 'Jugendamt und Beratung können mit eurer Zustimmung mitlesen. Hast du Angst vor dem anderen Elternteil, hol dir zuerst Hilfe: Hilfetelefon 116 016, rund um die Uhr. Mehr unter Mehr → Hilfe.',
      },
    ],
  },
  appLock: {
    locked: 'Gesperrt – nur du kannst die App öffnen.',
    unlock: 'Entsperren',
    prompt: 'Zwei Zuhause entsperren',
    enterCode: 'Code eingeben',
  },
};
