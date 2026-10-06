/**
 * Artefakt-Variante von src/lib/supabase.ts (wird beim Build an dessen Stelle kopiert).
 *
 * Bietet genau den Teil der Supabase-Schnittstelle, den die App nutzt, speichert aber in der
 * Datenbank des Claude-Artefakts (`db`-Capability). Wer gerade schaut, kommt aus der
 * `user`-Capability: Der Eigentümer des Artefakts übernimmt die Rolle `owner_role` aus
 * `couples/main`, die andere Person die zweite Rolle. Ohne Artefakt-Umgebung (lokaler Test)
 * wird im Browser-Speicher gespeichert.
 */

type Row = Record<string, any>;

interface Backend {
  list(table: string): Promise<Row[]>;
  get(table: string, id: string): Promise<Row | null>;
  put(table: string, id: string, row: Row): Promise<void>;
  remove(table: string, id: string): Promise<void>;
  subscribe(table: string, onChange: () => void): () => void;
}

function claudeBackend(db: any): Backend {
  return {
    async list(table) {
      const snap = await db.collection(table).get();
      return snap.docs.map((d: any) => ({ ...d.data() }));
    },
    async get(table, id) {
      const snap = await db.collection(table).doc(id).get();
      return snap.exists ? { ...snap.data() } : null;
    },
    put: (table, id, row) => db.collection(table).doc(id).set(row),
    remove: (table, id) => db.collection(table).doc(id).delete(),
    subscribe: (table, onChange) =>
      db.collection(table).onSnapshot(
        () => onChange(),
        () => {},
      ),
  };
}

function localBackend(): Backend {
  const KEY = 'wir-zwei-artefakt';
  let data: Record<string, Record<string, Row>> = {};
  try {
    data = JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    data = {};
  }
  const listeners: Record<string, Set<() => void>> = {};
  const persist = (table: string) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Ohne Browser-Speicher bleibt es für diese Sitzung im Speicher.
    }
    listeners[table]?.forEach((fn) => fn());
  };
  return {
    list: async (table) => Object.values(data[table] ?? {}).map((r) => ({ ...r })),
    get: async (table, id) => (data[table]?.[id] ? { ...data[table][id] } : null),
    put: async (table, id, row) => {
      data[table] = { ...data[table], [id]: row };
      persist(table);
    },
    remove: async (table, id) => {
      if (data[table]) delete data[table][id];
      persist(table);
    },
    subscribe: (table, onChange) => {
      (listeners[table] ??= new Set()).add(onChange);
      return () => listeners[table].delete(onChange);
    },
  };
}

interface Env {
  backend: Backend;
  me: string;
  isOwner: boolean;
}

const ready: Promise<Env> = (async () => {
  const claude = (globalThis as any).claude;
  if (claude?.use) {
    const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
    const me: string | null = user ? await user.id() : null;
    if (db && me) return { backend: claudeBackend(db), me, isOwner: await user.isOwner() };
  }
  return { backend: localBackend(), me: 'lokal', isOwner: true };
})();

const randomId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

const DEFAULTS: Record<string, (me: string) => Row> = {
  memories: (me) => ({ text: '', photo_path: null, created_by: me }),
  wishes: () => ({ note: '', category: 'sonstiges', author: 'both', done: false, done_at: null }),
  special_dates: () => ({ emoji: '💖', yearly: true }),
  notes: (me) => ({ author_id: me }),
  moods: (me) => ({ user_id: me }),
  answers: (me) => ({ user_id: me }),
  date_ideas: () => ({ emoji: '💡', done: false }),
};

const docId = (table: string, row: Row) =>
  table === 'moods' || table === 'answers' ? `${row.user_id}_${row.day}` : String(row.id);

/** Wer welche Rolle hat, steht in couples/main; beim ersten Besuch trägt sich jeder selbst ein. */
async function loadCouple(env: Env): Promise<Row | null> {
  let row = await env.backend.get('couples', 'main');
  if (!row) return null;
  const ownerRole = row.owner_role === 'a' ? 'a' : 'b';
  const myRole = env.isOwner ? ownerRole : ownerRole === 'a' ? 'b' : 'a';
  const key = myRole === 'a' ? 'partner_a' : 'partner_b';
  if (row[key] !== env.me && (env.isOwner || !row[key])) {
    row = { ...row, [key]: env.me };
    await env.backend.put('couples', 'main', row);
  }
  // Der Partner gilt als verbunden, auch bevor er das Artefakt zum ersten Mal öffnet.
  return {
    ...row,
    id: 'main',
    invite_code: '',
    partner_a: row.partner_a ?? 'noch-nicht-geoeffnet-a',
    partner_b: row.partner_b ?? 'noch-nicht-geoeffnet-b',
  };
}

type Result = { data: any; error: { message: string } | null };
const ok = (data: any): Result => ({ data, error: null });
const fail = (message: string): Result => ({ data: null, error: { message } });

function from(table: string) {
  let op: 'select' | 'insert' | 'upsert' | 'update' | 'delete' = 'select';
  let payload: Row = {};
  const eqs: [string, unknown][] = [];
  const gtes: [string, string][] = [];
  let sort: { col: string; asc: boolean } | null = null;
  let max: number | null = null;

  const run = async (): Promise<Result> => {
    try {
      const env = await ready;
      const { backend, me } = env;
      if (table === 'couples') {
        if (op === 'select') {
          const row = await loadCouple(env);
          return ok(row ? [row] : []);
        }
        if (op === 'update') {
          const row = await backend.get('couples', 'main');
          if (row) await backend.put('couples', 'main', { ...row, ...payload });
          return ok(null);
        }
        return fail('not_supported');
      }
      const matches = (r: Row) => eqs.every(([k, v]) => r[k] === v);
      if (op === 'select') {
        let rows = (await backend.list(table)).filter(matches);
        rows = rows.filter((r) => gtes.every(([k, v]) => String(r[k]) >= v));
        if (table === 'answers') {
          // Die Antwort des Partners erst zeigen, wenn man selbst geantwortet hat.
          const answeredDays = new Set(rows.filter((r) => r.user_id === me).map((r) => r.day));
          rows = rows.filter((r) => r.user_id === me || answeredDays.has(r.day));
        }
        if (sort) {
          const { col, asc } = sort;
          rows.sort(
            (a, b) => (String(a[col]) < String(b[col]) ? -1 : String(a[col]) > String(b[col]) ? 1 : 0) * (asc ? 1 : -1),
          );
        }
        return ok(max ? rows.slice(0, max) : rows);
      }
      if (op === 'insert') {
        const row: Row = {
          ...DEFAULTS[table]?.(me),
          id: randomId(),
          created_at: new Date().toISOString(),
          ...payload,
        };
        const id = docId(table, row);
        if (table === 'answers' && (await backend.get(table, id))) return fail('Du hast heute schon geantwortet.');
        await backend.put(table, id, row);
        return ok(null);
      }
      if (op === 'upsert') {
        const row: Row = { ...DEFAULTS[table]?.(me), ...payload };
        await backend.put(table, docId(table, row), row);
        return ok(null);
      }
      const rows = (await backend.list(table)).filter(matches);
      for (const row of rows) {
        if (op === 'update') await backend.put(table, docId(table, row), { ...row, ...payload });
        else await backend.remove(table, docId(table, row));
      }
      return ok(null);
    } catch (e: any) {
      return fail(e?.message ?? String(e));
    }
  };

  const query: any = {
    select: () => query,
    order: (col: string, opts?: { ascending?: boolean }) => {
      sort = { col, asc: opts?.ascending !== false };
      return query;
    },
    limit: (n: number) => {
      max = n;
      return query;
    },
    gte: (col: string, value: string) => {
      gtes.push([col, value]);
      return query;
    },
    eq: (col: string, value: unknown) => {
      eqs.push([col, value]);
      return query;
    },
    insert: (row: Row) => {
      op = 'insert';
      payload = row;
      return query;
    },
    upsert: (row: Row) => {
      op = 'upsert';
      payload = row;
      return query;
    },
    update: (patch: Row) => {
      op = 'update';
      payload = patch;
      return query;
    },
    delete: () => {
      op = 'delete';
      return query;
    },
    then: (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) => run().then(resolve, reject),
  };
  return query;
}

/** Fotos verkleinern, damit sie in ein Dokument (max. 256 KiB) passen. */
async function compressToDataUrl(bytes: ArrayBuffer | Uint8Array, type: string): Promise<string> {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Bild konnte nicht gelesen werden.'));
      i.src = url;
    });
    let size = 1100;
    let quality = 0.8;
    let out = '';
    for (let attempt = 0; attempt < 8; attempt++) {
      const scale = Math.min(1, size / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      out = canvas.toDataURL('image/jpeg', quality);
      if (out.length < 230_000) return out;
      size = Math.round(size * 0.8);
      quality = Math.max(0.5, quality - 0.08);
    }
    throw new Error('Das Foto ist zu groß.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

const storageBucket = {
  upload: async (_path: string, bytes: ArrayBuffer | Uint8Array, opts?: { contentType?: string }): Promise<Result> => {
    try {
      const { backend } = await ready;
      const id = randomId();
      await backend.put('photos', id, { data: await compressToDataUrl(bytes, opts?.contentType ?? 'image/jpeg') });
      return ok({ path: id });
    } catch (e: any) {
      return fail(e?.message ?? String(e));
    }
  },
  remove: async (paths: string[]) => {
    const { backend } = await ready;
    await Promise.all(paths.map((p) => backend.remove('photos', p)));
    return ok(null);
  },
  createSignedUrls: async (paths: string[]) => {
    const { backend } = await ready;
    const docs = await Promise.all(paths.map((p) => backend.get('photos', p)));
    return ok(paths.map((path, i) => ({ path, signedUrl: docs[i]?.data ?? null })));
  },
};

export const supabase: any = {
  from,
  rpc: async (name: string, args: Row): Promise<Result> => {
    const { backend } = await ready;
    if (name === 'create_couple') {
      await backend.put('couples', 'main', {
        name_a: args.p_name_a,
        name_b: args.p_name_b,
        start_date: args.p_start_date,
        owner_role: 'a',
        partner_a: null,
        partner_b: null,
      });
      return ok('');
    }
    return fail('Im Artefakt verbindet ihr euch über das Teilen-Menü, nicht per Code.');
  },
  channel: () => {
    const tables: { table: string; cb: () => void }[] = [];
    let unsubs: (() => void)[] = [];
    const channel: any = {
      on: (_event: string, filter: { table: string }, cb: () => void) => {
        tables.push({ table: filter.table, cb });
        return channel;
      },
      subscribe: () => {
        ready.then(({ backend }) => {
          unsubs = tables.map(({ table, cb }) => backend.subscribe(table, cb));
        });
        return channel;
      },
      _close: () => unsubs.forEach((u) => u()),
    };
    return channel;
  },
  removeChannel: (channel: any) => channel?._close?.(),
  storage: { from: () => storageBucket },
  auth: {
    getSession: async () => {
      const { me } = await ready;
      return { data: { session: { user: { id: me } } }, error: null };
    },
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({ error: null }),
  },
};

export function must<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
