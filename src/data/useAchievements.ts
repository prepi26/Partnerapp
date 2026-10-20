import { computeAchievements } from '@/lib/achievements';
import { daysBetween, parseISO, today } from '@/lib/dates';
import { longestStreak } from '@/lib/streak';

import { useCouple } from './store';
import { useThoughtStats } from './thoughtStats';

export function useAchievements() {
  const { couple, answers, userId, notes, memories, wishes, date_ideas } = useCouple();
  const stats = useThoughtStats();

  const mine = new Set(answers.filter((a) => a.user_id === userId).map((a) => a.day));
  const bothAnsweredDays = new Set(answers.filter((a) => a.user_id !== userId && mine.has(a.day)).map((a) => a.day))
    .size;

  return computeAchievements({
    longestStreak: longestStreak(answers, userId),
    bothAnsweredDays,
    daysTogether: Math.max(0, daysBetween(parseISO(couple.start_date), today())),
    notes: notes.length,
    memories: memories.length,
    wishesDone: wishes.filter((w) => w.done).length,
    ideasDone: date_ideas.filter((i) => i.done).length,
    heartsTotal: stats ? stats.reduce((sum, s) => sum + s.total, 0) : null,
    heartsBestDay: stats ? Math.max(0, ...stats.map((s) => s.best_day)) : null,
  });
}
