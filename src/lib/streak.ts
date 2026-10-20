import { Answer, ISODate } from '@/data/types';

import { parseISO, toISO } from './dates';

function previousDay(day: ISODate): ISODate {
  const d = parseISO(day);
  d.setDate(d.getDate() - 1);
  return toISO(d);
}

/**
 * Wie viele Tage in Folge beide die Frage des Tages beantwortet haben.
 * Ein heute noch offener Tag bricht die Serie nicht – sie zählt dann ab gestern.
 */
export function answerStreak(answers: Pick<Answer, 'user_id' | 'day'>[], me: string, today: ISODate): number {
  const mine = new Set(answers.filter((a) => a.user_id === me).map((a) => a.day));
  const theirs = new Set(answers.filter((a) => a.user_id !== me).map((a) => a.day));
  const both = (day: ISODate) => mine.has(day) && theirs.has(day);

  let day = both(today) ? today : previousDay(today);
  let streak = 0;
  while (both(day)) {
    streak++;
    day = previousDay(day);
  }
  return streak;
}

/** Längste Serie aufeinanderfolgender Tage, an denen beide geantwortet haben (für die Erfolge). */
export function longestStreak(answers: Pick<Answer, 'user_id' | 'day'>[], me: string): number {
  const mine = new Set(answers.filter((a) => a.user_id === me).map((a) => a.day));
  const both = [...new Set(answers.filter((a) => a.user_id !== me && mine.has(a.day)).map((a) => a.day))].sort();
  let best = 0;
  let run = 0;
  let previous: ISODate | null = null;
  for (const day of both) {
    run = previous && previousDay(day) === previous ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}
