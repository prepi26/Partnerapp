/** Paar-Erfolge: werden aus vorhandenen Daten berechnet, nichts muss extra gespeichert werden. */

export interface AchievementInput {
  longestStreak: number;
  bothAnsweredDays: number;
  daysTogether: number;
  notes: number;
  drawings: number;
  memories: number;
  wishesDone: number;
  ideasDone: number;
  moodDays: number;
  heartsTotal: number | null;
  heartsBestDay: number | null;
  heartStreak: number | null;
  nightHearts: number | null;
  earlyHearts: number | null;
  quizRounds: number;
  quizPerfect: number;
  engaged: number;
  married: number;
}

export type AchievementGroup =
  | 'Herzen'
  | 'Frage & Quiz'
  | 'Zettel & Zeichnungen'
  | 'Erinnerungen & Wünsche'
  | 'Zusammen';
export const GROUPS: AchievementGroup[] = [
  'Herzen',
  'Frage & Quiz',
  'Zettel & Zeichnungen',
  'Erinnerungen & Wünsche',
  'Zusammen',
];

export interface Achievement {
  id: string;
  group: AchievementGroup;
  emoji: string;
  title: string;
  text: string;
  value: number;
  goal: number;
  unlocked: boolean;
}

type Metric = keyof AchievementInput;
type Def = { id: string; emoji: string; title: string; text: string; metric: Metric; goal: number };

const LIST: Record<AchievementGroup, Def[]> = {
  Herzen: [
    {
      id: 'hearts1',
      emoji: '💗',
      title: 'Erstes Herz',
      text: 'Das erste „Ich denk an dich“ verschickt',
      metric: 'heartsTotal',
      goal: 1,
    },
    {
      id: 'hearts10day',
      emoji: '🥰',
      title: 'Verliebt',
      text: '10 Herzen an einem Tag',
      metric: 'heartsBestDay',
      goal: 10,
    },
    {
      id: 'hearts100day',
      emoji: '💓',
      title: 'Herzklopfen-Rekord',
      text: '100 Herzen an einem Tag',
      metric: 'heartsBestDay',
      goal: 100,
    },
    {
      id: 'hearts1000day',
      emoji: '🤯',
      title: 'Daumen aus Stahl',
      text: '1.000 Herzen an einem einzigen Tag',
      metric: 'heartsBestDay',
      goal: 1000,
    },
    {
      id: 'hearts100',
      emoji: '💞',
      title: '100 Gedanken',
      text: 'Zusammen 100 Herzen verschickt',
      metric: 'heartsTotal',
      goal: 100,
    },
    {
      id: 'hearts1000',
      emoji: '💖',
      title: 'Tausend Gedanken',
      text: 'Zusammen 1.000 Herzen verschickt',
      metric: 'heartsTotal',
      goal: 1000,
    },
    {
      id: 'hearts10000',
      emoji: '🚀',
      title: 'Zehntausend Gedanken',
      text: 'Zusammen 10.000 Herzen verschickt',
      metric: 'heartsTotal',
      goal: 10000,
    },
    {
      id: 'hearts100000',
      emoji: '🌌',
      title: 'Unendlich verliebt',
      text: 'Zusammen 100.000 Herzen verschickt',
      metric: 'heartsTotal',
      goal: 100000,
    },
    {
      id: 'heartStreak7',
      emoji: '📆',
      title: 'Eine Woche voller Herzen',
      text: '7 Tage am Stück mindestens ein Herz',
      metric: 'heartStreak',
      goal: 7,
    },
    {
      id: 'heartStreak30',
      emoji: '🔥',
      title: 'Ein Monat ohne Pause',
      text: '30 Tage am Stück mindestens ein Herz',
      metric: 'heartStreak',
      goal: 30,
    },
    {
      id: 'heartStreak100',
      emoji: '💯',
      title: '100 Tage Herzklopfen',
      text: '100 Tage am Stück mindestens ein Herz',
      metric: 'heartStreak',
      goal: 100,
    },
    {
      id: 'heartStreak365',
      emoji: '🏅',
      title: 'Ein Jahr Dauerliebe',
      text: '365 Tage am Stück mindestens ein Herz',
      metric: 'heartStreak',
      goal: 365,
    },
    {
      id: 'night1',
      emoji: '🦉',
      title: 'Nachteule',
      text: 'Ein Herz zwischen Mitternacht und 4 Uhr',
      metric: 'nightHearts',
      goal: 1,
    },
    {
      id: 'night100',
      emoji: '🌙',
      title: 'Schlaflos verliebt',
      text: '100 Herzen mitten in der Nacht',
      metric: 'nightHearts',
      goal: 100,
    },
    {
      id: 'early1',
      emoji: '🌅',
      title: 'Frühaufsteher-Liebe',
      text: 'Ein Herz zwischen 5 und 7 Uhr morgens',
      metric: 'earlyHearts',
      goal: 1,
    },
  ],
  'Frage & Quiz': [
    {
      id: 'streak3',
      emoji: '🔥',
      title: 'Gutes Team',
      text: '3 Tage in Folge die Frage des Tages beantwortet',
      metric: 'longestStreak',
      goal: 3,
    },
    {
      id: 'streak7',
      emoji: '🔥',
      title: 'Eine ganze Woche',
      text: '7 Tage in Folge geantwortet',
      metric: 'longestStreak',
      goal: 7,
    },
    {
      id: 'streak30',
      emoji: '🌟',
      title: 'Ein Monat voller Fragen',
      text: '30 Tage in Folge geantwortet',
      metric: 'longestStreak',
      goal: 30,
    },
    {
      id: 'streak100',
      emoji: '🏆',
      title: 'Unzertrennlich',
      text: '100 Tage in Folge geantwortet',
      metric: 'longestStreak',
      goal: 100,
    },
    {
      id: 'streak365',
      emoji: '👑',
      title: 'Seelenverwandt',
      text: 'Ein ganzes Jahr jeden Tag geantwortet',
      metric: 'longestStreak',
      goal: 365,
    },
    {
      id: 'answers50',
      emoji: '💬',
      title: 'Kennt ihr euch?',
      text: '50 Fragen gemeinsam beantwortet',
      metric: 'bothAnsweredDays',
      goal: 50,
    },
    {
      id: 'answers500',
      emoji: '📚',
      title: 'Wandelndes Lexikon',
      text: '500 Fragen gemeinsam beantwortet',
      metric: 'bothAnsweredDays',
      goal: 500,
    },
    {
      id: 'quiz1',
      emoji: '🎯',
      title: 'Erste Quizrunde',
      text: 'Das erste Mal zusammen gequizzt',
      metric: 'quizRounds',
      goal: 1,
    },
    {
      id: 'quiz20',
      emoji: '🧠',
      title: 'Quiz-Profis',
      text: '20 Quizrunden zusammen gespielt',
      metric: 'quizRounds',
      goal: 20,
    },
    {
      id: 'quiz100',
      emoji: '🎓',
      title: 'Quiz-Legenden',
      text: '100 Quizrunden zusammen gespielt',
      metric: 'quizRounds',
      goal: 100,
    },
    {
      id: 'quizPerfect',
      emoji: '🔮',
      title: 'Gedankenleser',
      text: 'In einer Quizrunde alle Tipps richtig',
      metric: 'quizPerfect',
      goal: 1,
    },
    {
      id: 'quizPerfect10',
      emoji: '🧿',
      title: 'Telepathie',
      text: '10 perfekte Quizrunden',
      metric: 'quizPerfect',
      goal: 10,
    },
  ],
  'Zettel & Zeichnungen': [
    {
      id: 'note1',
      emoji: '✉️',
      title: 'Erster Liebeszettel',
      text: 'Den ersten Zettel geschrieben',
      metric: 'notes',
      goal: 1,
    },
    { id: 'notes100', emoji: '💌', title: 'Liebesbriefe', text: '100 Zettel geschrieben', metric: 'notes', goal: 100 },
    {
      id: 'notes1000',
      emoji: '📜',
      title: 'Romanautoren',
      text: '1.000 Zettel geschrieben',
      metric: 'notes',
      goal: 1000,
    },
    {
      id: 'drawing1',
      emoji: '🎨',
      title: 'Erstes Kunstwerk',
      text: 'Die erste Zeichnung verschickt',
      metric: 'drawings',
      goal: 1,
    },
    {
      id: 'drawings50',
      emoji: '🖼️',
      title: 'Eigene Galerie',
      text: '50 Zeichnungen verschickt',
      metric: 'drawings',
      goal: 50,
    },
    {
      id: 'drawings365',
      emoji: '🏛️',
      title: 'Museumsreif',
      text: '365 Zeichnungen verschickt',
      metric: 'drawings',
      goal: 365,
    },
  ],
  'Erinnerungen & Wünsche': [
    {
      id: 'memory1',
      emoji: '📸',
      title: 'Erster Moment',
      text: 'Die erste Erinnerung festgehalten',
      metric: 'memories',
      goal: 1,
    },
    {
      id: 'memories25',
      emoji: '📒',
      title: 'Unser Album',
      text: '25 Erinnerungen festgehalten',
      metric: 'memories',
      goal: 25,
    },
    {
      id: 'memories100',
      emoji: '🎞️',
      title: 'Unsere Chronik',
      text: '100 Erinnerungen festgehalten',
      metric: 'memories',
      goal: 100,
    },
    {
      id: 'wish1',
      emoji: '⭐',
      title: 'Wunsch erfüllt',
      text: 'Den ersten gemeinsamen Wunsch erfüllt',
      metric: 'wishesDone',
      goal: 1,
    },
    {
      id: 'wishes10',
      emoji: '🌈',
      title: 'Träume wahr gemacht',
      text: '10 Wünsche erfüllt',
      metric: 'wishesDone',
      goal: 10,
    },
    {
      id: 'wishes50',
      emoji: '🌠',
      title: 'Bucket-List-Legenden',
      text: '50 Wünsche erfüllt',
      metric: 'wishesDone',
      goal: 50,
    },
    { id: 'ideas5', emoji: '🍷', title: 'Date-Profis', text: '5 Date-Ideen erledigt', metric: 'ideasDone', goal: 5 },
    {
      id: 'ideas25',
      emoji: '🍾',
      title: 'Date-Weltmeister',
      text: '25 Date-Ideen erledigt',
      metric: 'ideasDone',
      goal: 25,
    },
    {
      id: 'mood30',
      emoji: '😊',
      title: 'Gefühlsprofis',
      text: 'An 30 Tagen haben beide ihre Stimmung geteilt',
      metric: 'moodDays',
      goal: 30,
    },
  ],
  Zusammen: [
    { id: 'days100', emoji: '🎉', title: '100 Tage', text: '100 Tage zusammen', metric: 'daysTogether', goal: 100 },
    {
      id: 'days365',
      emoji: '🥂',
      title: 'Ein ganzes Jahr',
      text: '365 Tage zusammen',
      metric: 'daysTogether',
      goal: 365,
    },
    {
      id: 'days1000',
      emoji: '👑',
      title: '1.000 Tage',
      text: '1.000 Tage zusammen',
      metric: 'daysTogether',
      goal: 1000,
    },
    {
      id: 'days2000',
      emoji: '💎',
      title: '2.000 Tage',
      text: '2.000 Tage zusammen',
      metric: 'daysTogether',
      goal: 2000,
    },
    {
      id: 'days3650',
      emoji: '🏡',
      title: 'Zehn Jahre',
      text: '3.650 Tage zusammen',
      metric: 'daysTogether',
      goal: 3650,
    },
    {
      id: 'days10000',
      emoji: '♾️',
      title: 'Für immer',
      text: '10.000 Tage zusammen – über 27 Jahre',
      metric: 'daysTogether',
      goal: 10000,
    },
    {
      id: 'engaged',
      emoji: '💍',
      title: 'Verlobt!',
      text: 'In den Einstellungen „Verlobt“ oder „Verheiratet“ gewählt',
      metric: 'engaged',
      goal: 1,
    },
    { id: 'married', emoji: '💒', title: 'Ja, ich will', text: 'Verheiratet', metric: 'married', goal: 1 },
  ],
};

export const ACHIEVEMENT_COUNT = Object.values(LIST).reduce((sum, list) => sum + list.length, 0);

export function computeAchievements(input: AchievementInput): Achievement[] {
  return GROUPS.flatMap((group) =>
    LIST[group].map(({ metric, goal, ...rest }) => {
      const value = Math.max(0, input[metric] ?? 0);
      return { ...rest, group, goal, value: Math.min(value, goal), unlocked: value >= goal };
    }),
  );
}
