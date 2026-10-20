import { useCouple } from './store';
import { useThoughtStats } from './thoughtStats';

export interface YearReview {
  year: number;
  hearts: number | null;
  notes: number;
  memories: number;
  answers: number;
  wishesDone: number;
  dateIdeas: number;
}

/** Zahlen für „Euer Jahr“: alles, was ihr in diesem Kalenderjahr zusammen gemacht habt. */
export function useYearReview(): YearReview {
  const { notes, memories, answers, wishes, date_ideas, userId } = useCouple();
  const stats = useThoughtStats();
  const year = new Date().getFullYear();
  const inYear = (iso: string | null | undefined) => !!iso && iso.startsWith(String(year));

  const mine = new Set(answers.filter((a) => a.user_id === userId && inYear(a.day)).map((a) => a.day));
  const both = new Set(answers.filter((a) => a.user_id !== userId && mine.has(a.day)).map((a) => a.day));

  return {
    year,
    hearts: stats ? stats.reduce((sum, s) => sum + s.year, 0) : null,
    notes: notes.filter((n) => inYear(n.created_at)).length,
    memories: memories.filter((m) => inYear(m.date)).length,
    answers: both.size,
    wishesDone: wishes.filter((w) => w.done && inYear(w.done_at)).length,
    dateIdeas: date_ideas.filter((i) => i.done && inYear(i.created_at)).length,
  };
}
