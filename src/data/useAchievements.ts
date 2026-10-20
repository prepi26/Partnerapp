import { computeAchievements } from '@/lib/achievements';

import { QUIZ_PER_DAY, quizRounds } from './quiz';
import { daysBetween, parseISO, today } from '@/lib/dates';
import { longestStreak } from '@/lib/streak';

import { useCouple } from './store';
import { useCoupleStats, useThoughtStats } from './thoughtStats';

export function useAchievements() {
  const { couple, answers, userId, notes, memories, wishes, date_ideas, quiz_answers } = useCouple();
  const stats = useThoughtStats();
  const extra = useCoupleStats();

  const mine = new Set(answers.filter((a) => a.user_id === userId).map((a) => a.day));
  const bothAnsweredDays = new Set(answers.filter((a) => a.user_id !== userId && mine.has(a.day)).map((a) => a.day))
    .size;

  const rounds = quizRounds(quiz_answers, userId);

  return computeAchievements({
    longestStreak: longestStreak(answers, userId),
    bothAnsweredDays,
    daysTogether: Math.max(0, daysBetween(parseISO(couple.start_date), today())),
    notes: Math.max(notes.length, extra?.notes ?? 0),
    drawings: extra?.drawings ?? 0,
    moodDays: extra?.mood_days ?? 0,
    heartStreak: extra?.heart_streak ?? null,
    nightHearts: extra?.night_hearts ?? null,
    earlyHearts: extra?.early_hearts ?? null,
    engaged: couple.status === 'engaged' || couple.status === 'married' ? 1 : 0,
    married: couple.status === 'married' ? 1 : 0,
    memories: memories.length,
    wishesDone: wishes.filter((w) => w.done).length,
    ideasDone: date_ideas.filter((i) => i.done).length,
    heartsTotal: stats ? stats.reduce((sum, s) => sum + s.total, 0) : null,
    heartsBestDay: stats ? Math.max(0, ...stats.map((s) => s.best_day)) : null,
    quizRounds: rounds.filter((r) => r.myScore !== null).length,
    quizPerfect: rounds.filter((r) => r.myScore === QUIZ_PER_DAY || r.theirScore === QUIZ_PER_DAY).length,
  });
}
