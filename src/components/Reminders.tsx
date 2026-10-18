import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useCouple } from '@/data/store';
import { toISO, today } from '@/lib/dates';
import { scheduleReminders } from '@/lib/reminders';
import { answerStreak } from '@/lib/streak';

/** Hält die lokalen Erinnerungen aktuell: bei jedem Start, jeder Antwort und wenn die App wieder nach vorn kommt. */
export function Reminders() {
  const { answers, userId, partnerName } = useCouple();
  const day = toISO(today());
  const answeredToday = answers.some((a) => a.user_id === userId && a.day === day);
  const streak = answerStreak(answers, userId, day);

  useEffect(() => {
    const plan = () => scheduleReminders({ partnerName, answeredToday, streak });
    plan();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && plan());
    return () => sub.remove();
  }, [partnerName, answeredToday, streak]);

  return null;
}
