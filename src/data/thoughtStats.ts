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
