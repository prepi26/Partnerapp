import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { deletePhoto } from './photos';
import { localStorage, StateStorage } from './storage';
import { AppState, Couple, emptyState, Memory, SpecialDate, Wish } from './types';

type NewMemory = Omit<Memory, 'id' | 'createdAt'> & { id?: string };
type NewWish = Omit<Wish, 'id' | 'createdAt' | 'done' | 'doneAt'>;
type NewDate = Omit<SpecialDate, 'id' | 'createdAt'>;

interface Store {
  ready: boolean;
  state: AppState;
  setCouple(couple: Couple): void;
  addMemory(memory: NewMemory): void;
  removeMemory(id: string): void;
  addWish(wish: NewWish): void;
  toggleWish(id: string): void;
  removeWish(id: string): void;
  addDate(date: NewDate): void;
  removeDate(id: string): void;
  resetAll(): Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function StoreProvider({
  children,
  storage = localStorage,
}: {
  children: ReactNode;
  storage?: StateStorage;
}) {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    // Wenn der Speicher nicht lesbar ist, startet die App leer statt hängen zu bleiben.
    storage
      .load()
      .catch(() => emptyState)
      .then((s) => {
        setState(s);
        loaded.current = true;
        setReady(true);
      });
  }, [storage]);

  useEffect(() => {
    if (loaded.current) storage.save(state).catch(() => {});
  }, [state, storage]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);

  const store = useMemo<Store>(
    () => ({
      ready,
      state,
      setCouple: (couple) => update((s) => ({ ...s, couple })),
      addMemory: ({ id, ...memory }) =>
        update((s) => ({
          ...s,
          memories: [...s.memories, { ...memory, id: id ?? newId(), createdAt: Date.now() }],
        })),
      removeMemory: (id) => {
        deletePhoto(state.memories.find((m) => m.id === id)?.photoUri);
        update((s) => ({ ...s, memories: s.memories.filter((m) => m.id !== id) }));
      },
      addWish: (wish) =>
        update((s) => ({
          ...s,
          wishes: [...s.wishes, { ...wish, id: newId(), done: false, createdAt: Date.now() }],
        })),
      toggleWish: (id) =>
        update((s) => ({
          ...s,
          wishes: s.wishes.map((w) =>
            w.id === id ? { ...w, done: !w.done, doneAt: w.done ? undefined : Date.now() } : w,
          ),
        })),
      removeWish: (id) => update((s) => ({ ...s, wishes: s.wishes.filter((w) => w.id !== id) })),
      addDate: (date) =>
        update((s) => ({ ...s, dates: [...s.dates, { ...date, id: newId(), createdAt: Date.now() }] })),
      removeDate: (id) => update((s) => ({ ...s, dates: s.dates.filter((d) => d.id !== id) })),
      resetAll: async () => {
        state.memories.forEach((m) => deletePhoto(m.photoUri));
        await storage.clear();
        setState(emptyState);
      },
    }),
    [ready, state, update, storage],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore muss innerhalb von <StoreProvider> verwendet werden');
  return store;
}
