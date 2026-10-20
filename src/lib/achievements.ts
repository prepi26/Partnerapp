/** Paar-Erfolge: werden aus den vorhandenen Daten berechnet, nichts muss extra gespeichert werden. */

export interface AchievementInput {
  longestStreak: number;
  bothAnsweredDays: number;
  daysTogether: number;
  notes: number;
  memories: number;
  wishesDone: number;
  ideasDone: number;
  heartsTotal: number | null;
  heartsBestDay: number | null;
  quizRounds: number;
  quizPerfect: number;
}

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  text: string;
  value: number;
  goal: number;
  unlocked: boolean;
}

type Metric = keyof AchievementInput;

const LIST: { id: string; emoji: string; title: string; text: string; metric: Metric; goal: number }[] = [
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
    id: 'answers50',
    emoji: '💬',
    title: 'Kennt ihr euch?',
    text: '50 Fragen gemeinsam beantwortet',
    metric: 'bothAnsweredDays',
    goal: 50,
  },
  {
    id: 'hearts10day',
    emoji: '💗',
    title: 'Verliebt',
    text: '10 Herzen an einem Tag geschickt',
    metric: 'heartsBestDay',
    goal: 10,
  },
  {
    id: 'hearts100day',
    emoji: '💓',
    title: 'Herzklopfen-Rekord',
    text: '100 Herzen an einem Tag geschickt',
    metric: 'heartsBestDay',
    goal: 100,
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
    id: 'quiz1',
    emoji: '🎯',
    title: 'Erste Quizrunde',
    text: 'Das erste Mal zusammen gequizzt',
    metric: 'quizRounds',
    goal: 1,
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
    id: 'quiz20',
    emoji: '🧠',
    title: 'Quiz-Profis',
    text: '20 Quizrunden zusammen gespielt',
    metric: 'quizRounds',
    goal: 20,
  },
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
    id: 'memory1',
    emoji: '📸',
    title: 'Erster Moment',
    text: 'Die erste Erinnerung festgehalten',
    metric: 'memories',
    goal: 1,
  },
  {
    id: 'memories25',
    emoji: '📚',
    title: 'Unser Album',
    text: '25 Erinnerungen festgehalten',
    metric: 'memories',
    goal: 25,
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
  { id: 'ideas5', emoji: '🍷', title: 'Date-Profis', text: '5 Date-Ideen erledigt', metric: 'ideasDone', goal: 5 },
  { id: 'days100', emoji: '🎉', title: '100 Tage', text: '100 Tage zusammen', metric: 'daysTogether', goal: 100 },
  {
    id: 'days365',
    emoji: '🥂',
    title: 'Ein ganzes Jahr',
    text: '365 Tage zusammen',
    metric: 'daysTogether',
    goal: 365,
  },
  { id: 'days1000', emoji: '👑', title: '1.000 Tage', text: '1.000 Tage zusammen', metric: 'daysTogether', goal: 1000 },
];

export function computeAchievements(input: AchievementInput): Achievement[] {
  return LIST.map(({ metric, goal, ...rest }) => {
    const value = Math.max(0, input[metric] ?? 0);
    return { ...rest, goal, value: Math.min(value, goal), unlocked: value >= goal };
  });
}
