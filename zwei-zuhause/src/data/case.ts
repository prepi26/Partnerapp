import { useCallback, useEffect, useState } from 'react';

import { must, supabase } from '@/lib/supabase';

import { signedReceiptUrls } from './receipts';
import { Agreement, ChildInfo, Decision, Expense, Family, Handover, Message, ScheduleChange } from './types';

/** Alles, was eine Fachkraft von einer Familie lesen darf (nie das Tagebuch). */
export interface CaseData {
  family: Family;
  schedule_changes: ScheduleChange[];
  expenses: Expense[];
  messages: Message[];
  child_info: ChildInfo[];
  decisions: Decision[];
  handovers: Handover[];
  agreements: Agreement[];
  receiptUrls: Record<string, string>;
}

async function load(familyId: string): Promise<CaseData | null> {
  const rows = must(await supabase.from('families').select('*').eq('id', familyId)) as Family[];
  const family = rows[0];
  if (!family) return null;
  const q = (table: string) => supabase.from(table).select('*').eq('family_id', familyId);
  const [schedule_changes, expenses, messages, child_info, decisions, handovers, agreements] = await Promise.all([
    q('schedule_changes').order('day'),
    q('expenses').order('day', { ascending: false }),
    q('messages').order('seq'),
    q('child_info').order('category').order('label'),
    q('decisions').order('created_at', { ascending: false }),
    q('handovers').order('day', { ascending: false }),
    q('agreements').order('version', { ascending: false }),
  ]);
  const expenseRows = must(expenses) as Expense[];
  const receiptUrls = await signedReceiptUrls(
    expenseRows.map((e) => e.receipt_path).filter((p): p is string => !!p),
  );
  return {
    family,
    schedule_changes: must(schedule_changes) as ScheduleChange[],
    expenses: expenseRows,
    messages: must(messages) as Message[],
    child_info: must(child_info) as ChildInfo[],
    decisions: must(decisions) as Decision[],
    handovers: must(handovers) as Handover[],
    agreements: must(agreements) as Agreement[],
    receiptUrls,
  };
}

/** Lädt eine Familie für die Fachkraft-Ansicht. null = kein (oder kein aktiver) Zugang mehr. */
export function useCase(familyId: string | undefined) {
  const [data, setData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCase = useCallback(async () => {
    if (!familyId) return;
    try {
      setData(await load(familyId));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    // Erst nach dem Laden Zustand setzen – nicht synchron im Effekt.
    load(familyId ?? '')
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [familyId]);

  const reload = useCallback(async () => {
    setLoading(true);
    await fetchCase();
  }, [fetchCase]);

  return { data, loading, error, reload };
}
