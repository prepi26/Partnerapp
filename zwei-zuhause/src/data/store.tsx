import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { showError } from '@/components/ui';
import { must, supabase } from '@/lib/supabase';

import { deleteAllReceipts, deleteReceipt, signedReceiptUrls, uploadReceipt } from './receipts';
import { Expense, ExpenseKind, Family, ISODate, JournalEntry, Message, ParentKey, ScheduleChange } from './types';

interface Data {
  schedule_changes: ScheduleChange[];
  expenses: Expense[];
  messages: Message[];
  journal: JournalEntry[];
}

type Table = keyof Data;
const TABLES: Table[] = ['schedule_changes', 'expenses', 'messages', 'journal'];
/** Diese Tabellen teilen beide Elternteile – Live-Updates. Das Tagebuch ist privat. */
const SHARED: Table[] = ['schedule_changes', 'expenses', 'messages'];

const emptyData: Data = { schedule_changes: [], expenses: [], messages: [], journal: [] };

async function fetchTable<T extends Table>(table: T): Promise<Data[T]> {
  let query = supabase.from(table).select('*');
  if (table === 'messages') query = query.order('seq', { ascending: true });
  if (table === 'expenses') query = query.order('day', { ascending: false }).order('created_at', { ascending: false });
  if (table === 'journal') query = query.order('day', { ascending: false }).order('created_at', { ascending: false });
  if (table === 'schedule_changes') query = query.order('day', { ascending: true });
  return must(await query) as Data[T];
}

async function fetchFamily(): Promise<Family | null> {
  const rows = must(await supabase.from('families').select('*').limit(1)) as Family[];
  return rows[0] ?? null;
}

const ERRORS: Record<string, string> = {
  invalid_code: 'Dieser Code passt nicht oder wurde schon benutzt.',
  already_in_family: 'Du bist schon mit einer Familie verbunden.',
  not_authenticated: 'Bitte melde dich erneut an.',
  not_allowed: 'Das geht nicht mehr – vermutlich wurde es schon beantwortet.',
};

/** Übersetzt Server-Fehler in verständliche Sätze. */
export function errorMessage(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  for (const [key, text] of Object.entries(ERRORS)) if (message.includes(key)) return text;
  if (/network|fetch/i.test(message)) return 'Keine Verbindung zum Server. Bist du online?';
  return message;
}

/** Führt eine Aktion aus und zeigt bei Fehlern eine Meldung. Liefert true bei Erfolg. */
export async function attempt(action: () => Promise<unknown>): Promise<boolean> {
  try {
    await action();
    return true;
  } catch (e) {
    showError('Das hat nicht geklappt', errorMessage(e));
    return false;
  }
}

export interface NewPhoto {
  uri: string;
  mimeType?: string;
}

export interface NewExpense {
  kind: ExpenseKind;
  title: string;
  category: string;
  amount_cents: number;
  day: ISODate;
  paid_by: ParentKey;
  share_a: number;
  receipt?: NewPhoto;
}

type FamilyPatch = Partial<
  Pick<
    Family,
    'name_a' | 'name_b' | 'children' | 'schedule_model' | 'schedule_start' | 'schedule_first' | 'default_share_a'
  >
>;

interface Store extends Data {
  loading: boolean;
  /** Erster Ladeversuch fehlgeschlagen (z. B. offline). */
  loadFailed: boolean;
  retry(): Promise<void>;
  userId: string;
  family: Family | null;
  me: ParentKey;
  otherKey: ParentKey;
  myName: string;
  otherName: string;
  nameOf(key: ParentKey): string;
  /** Der andere Elternteil ist (noch) mit der Familie verbunden. */
  otherJoined: boolean;
  receiptUrls: Record<string, string>;
  refresh(): Promise<void>;
  createFamily(myName: string, otherName: string, children: string): Promise<void>;
  joinFamily(code: string): Promise<void>;
  updateFamily(patch: FamilyPatch): Promise<void>;
  proposeChange(change: { day: ISODate; parent: ParentKey; note: string }): Promise<void>;
  answerChange(id: string, accept: boolean): Promise<void>;
  withdrawChange(id: string): Promise<void>;
  addExpense(expense: NewExpense): Promise<void>;
  answerExpense(id: string, confirm: boolean): Promise<void>;
  removeExpense(expense: Expense): Promise<void>;
  sendMessage(text: string): Promise<void>;
  markRead(): Promise<void>;
  addJournal(entry: { day: ISODate; text: string }): Promise<void>;
  removeJournal(id: string): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [family, setFamily] = useState<Family | null>(null);
  const [data, setData] = useState<Data>(emptyData);
  const [receiptUrls, setReceiptUrls] = useState<Record<string, string>>({});

  const reload = useCallback(async (table: Table) => {
    const rows = await fetchTable(table);
    setData((d) => ({ ...d, [table]: rows }));
    if (table === 'expenses') {
      const paths = (rows as Expense[]).map((e) => e.receipt_path).filter((p): p is string => !!p);
      const urls = await signedReceiptUrls(paths);
      setReceiptUrls((old) => ({ ...old, ...urls }));
    }
  }, []);

  const refresh = useCallback(async () => {
    const f = await fetchFamily();
    setFamily(f);
    // Das Tagebuch gehört dem Nutzer, nicht der Familie – es lädt auch ohne Familie.
    if (f) await Promise.all(TABLES.map(reload));
    else setData({ ...emptyData, journal: await fetchTable('journal') });
  }, [reload]);

  useEffect(() => {
    const initialLoad = async () => {
      try {
        await refresh();
        setLoadFailed(false);
      } catch {
        // Ohne Verbindung nicht so tun, als gäbe es keine Familie – sonst landet man im Onboarding.
        setLoadFailed(true);
      }
      setLoading(false);
    };
    initialLoad();
  }, [refresh]);

  // Beim Zurückkehren in die App alles neu laden – fängt verpasste Live-Updates ab.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh().catch(() => {});
    });
    return () => sub.remove();
  }, [refresh]);

  // Live-Updates: Einträge des anderen Elternteils erscheinen sofort.
  const familyId = family?.id;
  useEffect(() => {
    if (!familyId) return;
    const channel = supabase.channel(`family-${familyId}`);
    for (const table of SHARED) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `family_id=eq.${familyId}` },
        () => {
          reload(table).catch(() => {});
        },
      );
    }
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'families', filter: `id=eq.${familyId}` },
      () => {
        fetchFamily()
          .then(setFamily)
          .catch(() => {});
      },
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, reload]);

  const store = useMemo<Store>(() => {
    const me: ParentKey = family?.parent_b === userId ? 'b' : 'a';
    const otherKey: ParentKey = me === 'a' ? 'b' : 'a';
    const nameOf = (k: ParentKey) => (k === 'a' ? family?.name_a : family?.name_b) ?? '';
    const otherJoined = !!(otherKey === 'a' ? family?.parent_a : family?.parent_b);

    const after = async (table: Table, result: { error: { message: string } | null }) => {
      must({ data: null, error: result.error });
      await reload(table);
    };

    const cleanUp = async () => {
      await supabase.auth.signOut();
    };

    return {
      ...data,
      loading,
      loadFailed,
      retry: async () => {
        setLoading(true);
        try {
          await refresh();
          setLoadFailed(false);
        } catch {
          setLoadFailed(true);
        }
        setLoading(false);
      },
      userId,
      family,
      me,
      otherKey,
      myName: nameOf(me),
      otherName: nameOf(otherKey),
      nameOf,
      otherJoined,
      receiptUrls,
      refresh,
      createFamily: async (myName, otherName, kids) => {
        must(await supabase.rpc('create_family', { p_name_a: myName, p_name_b: otherName, p_children: kids }));
        await refresh();
      },
      joinFamily: async (code) => {
        must(await supabase.rpc('join_family', { p_code: code }));
        await refresh();
      },
      updateFamily: async (patch) => {
        if (!family) return;
        must(await supabase.from('families').update(patch).eq('id', family.id));
        setFamily(await fetchFamily());
      },
      proposeChange: async (change) =>
        after('schedule_changes', await supabase.from('schedule_changes').insert(change)),
      answerChange: async (id, accept) =>
        after('schedule_changes', await supabase.rpc('answer_schedule_change', { p_id: id, p_accept: accept })),
      withdrawChange: async (id) =>
        after('schedule_changes', await supabase.from('schedule_changes').delete().eq('id', id)),
      addExpense: async ({ receipt, ...expense }) => {
        if (!family) return;
        const receipt_path = receipt ? await uploadReceipt(family.id, receipt.uri, receipt.mimeType) : null;
        await after('expenses', await supabase.from('expenses').insert({ ...expense, receipt_path }));
      },
      answerExpense: async (id, confirm) =>
        after('expenses', await supabase.rpc('answer_expense', { p_id: id, p_confirm: confirm })),
      removeExpense: async (expense) => {
        await after('expenses', await supabase.from('expenses').delete().eq('id', expense.id));
        await deleteReceipt(expense.receipt_path);
      },
      sendMessage: async (text) => after('messages', await supabase.from('messages').insert({ text })),
      markRead: async () => {
        const unread = data.messages.some((m) => m.sender_key !== me && !m.read_at);
        if (unread) await after('messages', await supabase.rpc('mark_messages_read'));
      },
      addJournal: async (entry) => after('journal', await supabase.from('journal').insert(entry)),
      removeJournal: async (id) => after('journal', await supabase.from('journal').delete().eq('id', id)),
      deleteAccount: async () => {
        // Bin ich der letzte in der Familie, verschwinden mit ihr auch die Belege.
        if (family && !otherJoined) await deleteAllReceipts(family.id);
        must(await supabase.rpc('delete_my_account'));
        await cleanUp();
      },
      signOut: cleanUp,
    };
  }, [data, family, loadFailed, loading, receiptUrls, refresh, reload, userId]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore muss innerhalb von <StoreProvider> verwendet werden');
  return store;
}

/** Wie useStore, aber für Screens hinter dem Onboarding: die Familie existiert garantiert. */
export function useFamily() {
  const store = useStore();
  if (!store.family) throw new Error('Keine Familie geladen');
  return { ...store, family: store.family };
}
