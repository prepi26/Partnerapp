import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

import { useCouple } from './store';

export interface ThoughtStat {
  from_id: string;
  today: number;
  week: number;
  month: number;
  year: number;
  total: number;
  best_day: number;
}

export type StatPeriod = 'today' | 'week' | 'month' | 'year';

/**
 * Zählt die „Ich denk an dich“-Herzen pro Person (Server-Funktion thought_stats).
 * Lädt neu, sobald ein neues Herz ankommt. `null`, solange nichts geladen ist oder die Funktion fehlt.
 */
export function useThoughtStats() {
  const { thoughts } = useCouple();
  const [stats, setStats] = useState<ThoughtStat[] | null>(null);
  const latest = thoughts[thoughts.length - 1]?.id;

  useEffect(() => {
    let active = true;
    supabase.rpc('thought_stats').then(({ data, error }) => {
      if (!active || error || !Array.isArray(data)) return;
      setStats(
        (data as Record<string, unknown>[]).map((row) => ({
          from_id: String(row.from_id),
          today: Number(row.today) || 0,
          week: Number(row.week) || 0,
          month: Number(row.month) || 0,
          year: Number(row.year) || 0,
          total: Number(row.total) || 0,
          best_day: Number(row.best_day) || 0,
        })),
      );
    });
    return () => {
      active = false;
    };
  }, [latest]);

  return stats;
}

export interface CoupleStats {
  notes: number;
  drawings: number;
  heart_streak: number;
  night_hearts: number;
  early_hearts: number;
  mood_days: number;
}

/** Zahlen, die die App nicht selbst zählen kann (Server-Funktion couple_stats). `null`, solange nichts geladen ist. */
export function useCoupleStats() {
  const { thoughts, notes, drawings, moods } = useCouple();
  const [stats, setStats] = useState<CoupleStats | null>(null);
  const key = [thoughts.length, notes.length, drawings.length, moods.length].join('/');

  useEffect(() => {
    let active = true;
    supabase.rpc('couple_stats').then(({ data, error }) => {
      if (!active || error || !data || typeof data !== 'object') return;
      const row = data as Record<string, unknown>;
      const n = (k: string) => Number(row[k]) || 0;
      setStats({
        notes: n('notes'),
        drawings: n('drawings'),
        heart_streak: n('heart_streak'),
        night_hearts: n('night_hearts'),
        early_hearts: n('early_hearts'),
        mood_days: n('mood_days'),
      });
    });
    return () => {
      active = false;
    };
  }, [key]);

  return stats;
}
