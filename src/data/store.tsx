import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { showError } from '@/components/ui';
import { toISO, today } from '@/lib/dates';
import { must, supabase } from '@/lib/supabase';

import { deletePhoto, signedPhotoUrls, uploadPhoto } from './photos';
import {
  Answer,
  Couple,
  DateIdea,
  ISODate,
  Memory,
  Mood,
  Note,
  PackAnswer,
  PartnerKey,
  QuestionPack,
  SpecialDate,
  Wish,
  WishCategory,
} from './types';

interface Data {
  memories: Memory[];
  wishes: Wish[];
  special_dates: SpecialDate[];
  notes: Note[];
  moods: Mood[];
  answers: Answer[];
  pack_answers: PackAnswer[];
  date_ideas: DateIdea[];
}

type Table = keyof Data;
const TABLES: Table[] = ['memories', 'wishes', 'special_dates', 'notes', 'moods', 'answers', 'pack_answers', 'date_ideas'];

const emptyData: Data = {
  memories: [],
  wishes: [],
  special_dates: [],
  notes: [],
  moods: [],
  answers: [],
  pack_answers: [],
  date_ideas: [],
};

async function fetchTable<T extends Table>(table: T): Promise<Data[T]> {
  let query = supabase.from(table).select('*');
  if (table === 'notes') query = query.order('created_at', { ascending: true }).limit(500);
  if (table === 'moods') {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    query = query.gte('day', toISO(since));
  }
  const result = await query;
  // Ältere Datenbanken ohne Plus-Tabelle: Themen-Fragen fehlen nur, statt dass die ganze App nicht lädt.
  if (table === 'pack_answers' && result.error) return [] as Data[T];
  return must(result) as Data[T];
}

async function fetchCouple(): Promise<Couple | null> {
  const rows = must(await supabase.from('couples').select('*').limit(1)) as Couple[];
  return rows[0] ?? null;
}

const ERRORS: Record<string, string> = {
  invalid_code: 'Dieser Code passt nicht oder wurde schon benutzt.',
  already_in_couple: 'Du bist schon mit jemandem verbunden.',
  not_authenticated: 'Bitte melde dich erneut an.',
  plus_required: 'Dafür braucht ihr Wir zwei Plus.',
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

interface Store extends Data {
  loading: boolean;
  /** Erster Ladeversuch fehlgeschlagen (z. B. offline). */
  loadFailed: boolean;
  retry(): Promise<void>;
  userId: string;
  couple: Couple | null;
  me: PartnerKey;
  partner: PartnerKey;
  myName: string;
  partnerName: string;
  partnerJoined: boolean;
  photoUrls: Record<string, string>;
  refresh(): Promise<void>;
  createCouple(nameA: string, nameB: string, startDate: ISODate): Promise<void>;
  joinCouple(code: string): Promise<void>;
  updateCouple(patch: Partial<Pick<Couple, 'name_a' | 'name_b' | 'start_date'>>): Promise<void>;
  addMemory(memory: { title: string; date: ISODate; text: string; photo?: NewPhoto }): Promise<void>;
  removeMemory(memory: Memory): Promise<void>;
  addWish(wish: { title: string; note: string; category: WishCategory; author: PartnerKey | 'both' }): Promise<void>;
  toggleWish(wish: Wish): Promise<void>;
  removeWish(id: string): Promise<void>;
  addDate(date: { title: string; date: ISODate; emoji: string; yearly: boolean }): Promise<void>;
  removeDate(id: string): Promise<void>;
  addNote(text: string): Promise<void>;
  removeNote(id: string): Promise<void>;
  setMood(emoji: string): Promise<void>;
  answer(day: ISODate, text: string): Promise<void>;
  answerPack(pack: QuestionPack, day: ISODate, text: string): Promise<void>;
  addIdea(idea: { title: string; emoji: string }): Promise<void>;
  toggleIdea(idea: DateIdea): Promise<void>;
  removeIdea(id: string): Promise<void>;
  signOut(): Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [data, setData] = useState<Data>(emptyData);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  const reload = useCallback(async (table: Table) => {
    const rows = await fetchTable(table);
    setData((d) => ({ ...d, [table]: rows }));
    if (table === 'memories') {
      const paths = (rows as Memory[]).map((m) => m.photo_path).filter((p): p is string => !!p);
      const urls = await signedPhotoUrls(paths);
      setPhotoUrls((old) => ({ ...old, ...urls }));
    }
  }, []);

  const refresh = useCallback(async () => {
    const c = await fetchCouple();
    setCouple(c);
    if (c) await Promise.all(TABLES.map(reload));
    else setData(emptyData);
  }, [reload]);

  useEffect(() => {
    const initialLoad = async () => {
      try {
        await refresh();
        setLoadFailed(false);
      } catch {
        // Ohne Verbindung nicht so tun, als gäbe es kein Paar – sonst landet man im Onboarding.
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

  // Live-Updates: Änderungen des Partners erscheinen sofort.
  const coupleId = couple?.id;
  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase.channel(`couple-${coupleId}`);
    for (const table of TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `couple_id=eq.${coupleId}` },
        () => {
          reload(table).catch(() => {});
        },
      );
    }
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
      () => {
        fetchCouple()
          .then(setCouple)
          .catch(() => {});
      },
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, reload]);

  const store = useMemo<Store>(() => {
    const me: PartnerKey = couple?.partner_b === userId ? 'b' : 'a';
    const partner: PartnerKey = me === 'a' ? 'b' : 'a';
    const nameOf = (k: PartnerKey) => (k === 'a' ? couple?.name_a : couple?.name_b) ?? '';

    const after = async (table: Table, result: { error: { message: string } | null }) => {
      must({ data: null, error: result.error });
      await reload(table);
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
      couple,
      me,
      partner,
      myName: nameOf(me),
      partnerName: nameOf(partner),
      partnerJoined: !!couple?.partner_b,
      photoUrls,
      refresh,
      createCouple: async (nameA, nameB, startDate) => {
        must(await supabase.rpc('create_couple', { p_name_a: nameA, p_name_b: nameB, p_start_date: startDate }));
        await refresh();
      },
      joinCouple: async (code) => {
        must(await supabase.rpc('join_couple', { p_code: code }));
        await refresh();
      },
      updateCouple: async (patch) => {
        if (!couple) return;
        must(await supabase.from('couples').update(patch).eq('id', couple.id));
        setCouple(await fetchCouple());
      },
      addMemory: async ({ photo, ...memory }) => {
        if (!couple) return;
        const photo_path = photo ? await uploadPhoto(couple.id, photo.uri, photo.mimeType) : null;
        await after('memories', await supabase.from('memories').insert({ ...memory, photo_path }));
      },
      removeMemory: async (memory) => {
        await after('memories', await supabase.from('memories').delete().eq('id', memory.id));
        await deletePhoto(memory.photo_path);
      },
      addWish: async (wish) => after('wishes', await supabase.from('wishes').insert(wish)),
      toggleWish: async (wish) =>
        after(
          'wishes',
          await supabase
            .from('wishes')
            .update({ done: !wish.done, done_at: wish.done ? null : new Date().toISOString() })
            .eq('id', wish.id),
        ),
      removeWish: async (id) => after('wishes', await supabase.from('wishes').delete().eq('id', id)),
      addDate: async (date) => after('special_dates', await supabase.from('special_dates').insert(date)),
      removeDate: async (id) => after('special_dates', await supabase.from('special_dates').delete().eq('id', id)),
      addNote: async (text) => after('notes', await supabase.from('notes').insert({ text })),
      removeNote: async (id) => after('notes', await supabase.from('notes').delete().eq('id', id)),
      setMood: async (emoji) =>
        after(
          'moods',
          await supabase
            .from('moods')
            .upsert({ day: toISO(today()), emoji, user_id: userId }, { onConflict: 'user_id,day' }),
        ),
      answer: async (day, text) => after('answers', await supabase.from('answers').insert({ day, answer: text })),
      answerPack: async (pack, day, text) =>
        after('pack_answers', await supabase.from('pack_answers').insert({ pack, day, answer: text })),
      addIdea: async (idea) => after('date_ideas', await supabase.from('date_ideas').insert(idea)),
      toggleIdea: async (idea) =>
        after('date_ideas', await supabase.from('date_ideas').update({ done: !idea.done }).eq('id', idea.id)),
      removeIdea: async (id) => after('date_ideas', await supabase.from('date_ideas').delete().eq('id', id)),
      signOut: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [couple, data, loadFailed, loading, photoUrls, refresh, reload, userId]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore muss innerhalb von <StoreProvider> verwendet werden');
  return store;
}

/** Wie useStore, aber für Screens hinter dem Onboarding: das Paar existiert garantiert. */
export function useCouple() {
  const store = useStore();
  if (!store.couple) throw new Error('Kein Paar geladen');
  return { ...store, couple: store.couple };
}
