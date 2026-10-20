-- "Wir zwei" – Datenbank für Supabase.
-- Einmal komplett im Supabase SQL Editor ausführen. Kann gefahrlos erneut ausgeführt werden.

-- ───────────── Paare ─────────────

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  partner_a uuid not null references auth.users (id) on delete cascade,
  partner_b uuid references auth.users (id) on delete set null,
  name_a text not null,
  name_b text not null,
  start_date date not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create unique index if not exists couples_partner_a_key on public.couples (partner_a);
create unique index if not exists couples_partner_b_key on public.couples (partner_b);

-- Das Paar des eingeloggten Nutzers (security definer, damit Policies sich nicht selbst aufrufen).
create or replace function public.my_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.couples
  where partner_a = auth.uid() or partner_b = auth.uid()
  limit 1
$$;

-- Neues Paar anlegen; liefert den Einladungscode für den Partner.
create or replace function public.create_couple(p_name_a text, p_name_b text, p_start_date date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if public.my_couple_id() is not null then
    raise exception 'already_in_couple';
  end if;
  loop
    -- 6 Großbuchstaben ohne verwechselbare (I, O). Keine Ziffern: dann reicht die Buchstaben-Tastatur.
    v_code := (
      select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ', (floor(random() * 24) + 1)::int, 1), '')
      from generate_series(1, 6)
    );
    exit when not exists (select 1 from public.couples where invite_code = v_code);
  end loop;
  insert into public.couples (partner_a, name_a, name_b, start_date, invite_code)
  values (auth.uid(), p_name_a, p_name_b, p_start_date, v_code);
  return v_code;
end;
$$;

-- Mit Einladungscode einem Paar beitreten.
create or replace function public.join_couple(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if public.my_couple_id() is not null then
    raise exception 'already_in_couple';
  end if;
  update public.couples
     set partner_b = auth.uid()
   where invite_code = upper(trim(p_code))
     and partner_b is null
     and partner_a <> auth.uid()
  returning id into v_id;
  if v_id is null then
    raise exception 'invalid_code';
  end if;
  return v_id;
end;
$$;

alter table public.couples enable row level security;

drop policy if exists couples_select on public.couples;
create policy couples_select on public.couples
  for select using (partner_a = auth.uid() or partner_b = auth.uid());

drop policy if exists couples_update on public.couples;
create policy couples_update on public.couples
  for update using (partner_a = auth.uid() or partner_b = auth.uid())
  with check (partner_a = auth.uid() or partner_b = auth.uid());

-- Partner dürfen Namen und Startdatum ändern, aber nicht, wer zum Paar gehört.
revoke update on public.couples from authenticated;
grant update (name_a, name_b, start_date) on public.couples to authenticated;

-- Beziehungsstatus: zusammen, verlobt (wedding_date = geplante Hochzeit) oder verheiratet (wedding_date = Hochzeitstag).
alter table public.couples add column if not exists status text not null default 'together';
alter table public.couples add column if not exists wedding_date date;
alter table public.couples drop constraint if exists couples_status_check;
alter table public.couples add constraint couples_status_check check (status in ('together', 'engaged', 'married'));
grant update (status, wedding_date) on public.couples to authenticated;

-- ───────────── Inhalte eines Paares ─────────────

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  title text not null,
  date date not null,
  text text not null default '',
  photo_path text,
  created_by uuid not null default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  title text not null,
  note text not null default '',
  category text not null default 'sonstiges' check (category in ('reise', 'erlebnis', 'geschenk', 'sonstiges')),
  author text not null default 'both' check (author in ('a', 'b', 'both')),
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.special_dates (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  title text not null,
  date date not null,
  emoji text not null default '💖',
  yearly boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text text not null check (length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.moods (
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  emoji text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table if not exists public.answers (
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  answer text not null check (length(answer) between 1 and 2000),
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table if not exists public.date_ideas (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  title text not null,
  emoji text not null default '💡',
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Gleiche Regel für alle gemeinsamen Inhalte: nur das eigene Paar.
do $$
declare
  t text;
begin
  foreach t in array array['memories', 'wishes', 'special_dates', 'date_ideas'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_couple', t);
    execute format(
      'create policy %I on public.%I for all using (couple_id = public.my_couple_id()) with check (couple_id = public.my_couple_id())',
      t || '_couple', t
    );
  end loop;
end;
$$;

-- Zettel: beide lesen, nur der Verfasser darf schreiben/löschen.
alter table public.notes enable row level security;
drop policy if exists notes_select on public.notes;
create policy notes_select on public.notes for select using (couple_id = public.my_couple_id());
drop policy if exists notes_insert on public.notes;
create policy notes_insert on public.notes for insert
  with check (couple_id = public.my_couple_id() and author_id = auth.uid());
drop policy if exists notes_delete on public.notes;
create policy notes_delete on public.notes for delete using (author_id = auth.uid());

-- Stimmung: beide lesen, jeder setzt nur seine eigene.
alter table public.moods enable row level security;
drop policy if exists moods_select on public.moods;
create policy moods_select on public.moods for select using (couple_id = public.my_couple_id());
drop policy if exists moods_write on public.moods;
create policy moods_write on public.moods for insert
  with check (couple_id = public.my_couple_id() and user_id = auth.uid());
drop policy if exists moods_update on public.moods;
create policy moods_update on public.moods for update
  using (user_id = auth.uid()) with check (couple_id = public.my_couple_id() and user_id = auth.uid());

-- Frage des Tages: Die Antwort des Partners ist erst sichtbar, wenn man selbst geantwortet hat.
create or replace function public.has_answered(p_day date)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.answers where user_id = auth.uid() and day = p_day)
$$;

alter table public.answers enable row level security;
drop policy if exists answers_select on public.answers;
create policy answers_select on public.answers for select using (
  user_id = auth.uid() or (couple_id = public.my_couple_id() and public.has_answered(day))
);
drop policy if exists answers_insert on public.answers;
create policy answers_insert on public.answers for insert
  with check (couple_id = public.my_couple_id() and user_id = auth.uid());

-- „Ich denk an dich“: ein Tipp erzeugt eine Zeile, der Partner sieht sie live.
create table if not exists public.thoughts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  from_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists thoughts_couple_created on public.thoughts (couple_id, created_at desc);

alter table public.thoughts enable row level security;
drop policy if exists thoughts_select on public.thoughts;
create policy thoughts_select on public.thoughts for select using (couple_id = public.my_couple_id());
drop policy if exists thoughts_insert on public.thoughts;
create policy thoughts_insert on public.thoughts for insert
  with check (couple_id = public.my_couple_id() and from_id = auth.uid());

-- ───────────── Konto löschen (Pflicht für den App Store) ─────────────

-- Löscht das eigene Konto und alle gemeinsamen Daten des Paares (auch für den Partner).
-- Fotos löscht die App vorher über die Storage-API, weil Supabase direkte Löschungen dort sperrt.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple uuid := public.my_couple_id();
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if v_couple is not null then
    delete from public.couples where id = v_couple;
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ───────────── Wir zwei Plus (Abo) ─────────────
-- Ein Abo gilt für beide Partner. plus_until setzen nur die Edge Functions (service_role),
-- nachdem sie den Kauf bei RevenueCat geprüft haben – Nutzer können die Spalte nicht ändern.

alter table public.couples add column if not exists plus_until timestamptz;

create or replace function public.couple_has_plus(p_couple uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select plus_until > now() from public.couples where id = p_couple), false)
$$;

-- App-weite Schalter (eine Zeile). Erst auf true setzen, wenn das Abo im Store wirklich kaufbar ist:
--   update public.app_settings set plus_enabled = true;
create table if not exists public.app_settings (
  id boolean primary key default true check (id),
  plus_enabled boolean not null default false
);
insert into public.app_settings (id) values (true) on conflict (id) do nothing;
alter table public.app_settings enable row level security;
drop policy if exists app_settings_read on public.app_settings;
create policy app_settings_read on public.app_settings for select using (true);

-- Ohne Plus: höchstens 10 Momente pro Paar.
create or replace function public.check_memory_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Das Limit gilt erst, wenn Plus im Store kaufbar ist (app_settings.plus_enabled).
  if coalesce((select plus_enabled from public.app_settings where id), false)
     and not public.couple_has_plus(new.couple_id)
     and (select count(*) from public.memories where couple_id = new.couple_id) >= 10 then
    raise exception 'plus_required';
  end if;
  return new;
end;
$$;

drop trigger if exists memories_limit on public.memories;
create trigger memories_limit before insert on public.memories
  for each row execute function public.check_memory_limit();

-- Themen-Fragen (nur Plus): eine Frage pro Paket und Tag, gleiche Regel wie bei der Frage des Tages.
create table if not exists public.pack_answers (
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pack text not null check (pack in ('tiefgang', 'zukunft', 'prickelnd')),
  day date not null,
  answer text not null check (length(answer) between 1 and 2000),
  created_at timestamptz not null default now(),
  primary key (user_id, pack, day)
);

create or replace function public.has_answered_pack(p_pack text, p_day date)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.pack_answers where user_id = auth.uid() and pack = p_pack and day = p_day)
$$;

alter table public.pack_answers enable row level security;
drop policy if exists pack_answers_select on public.pack_answers;
create policy pack_answers_select on public.pack_answers for select using (
  user_id = auth.uid() or (couple_id = public.my_couple_id() and public.has_answered_pack(pack, day))
);
drop policy if exists pack_answers_insert on public.pack_answers;
create policy pack_answers_insert on public.pack_answers for insert with check (
  couple_id = public.my_couple_id() and user_id = auth.uid() and public.couple_has_plus(couple_id)
);

-- ───────────── Fotos ─────────────

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists photos_couple on storage.objects;
create policy photos_couple on storage.objects for all
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.my_couple_id()::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = public.my_couple_id()::text);

-- ───────────── Spiel „Wie gut kennst du mich?“ ─────────────
-- Jeden Tag 3 Fragen. own = eigene Antwort, guess = Tipp für den Partner (Index 0–3).
-- Die Zeilen des Partners werden erst sichtbar, wenn man dieselbe Frage selbst beantwortet hat.
create table if not exists public.quiz_answers (
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  question_id text not null check (length(question_id) between 1 and 40),
  own smallint not null check (own between 0 and 3),
  guess smallint not null check (guess between 0 and 3),
  created_at timestamptz not null default now(),
  primary key (user_id, day, question_id)
);
create index if not exists quiz_answers_couple on public.quiz_answers (couple_id, day);

create or replace function public.has_quiz_answer(p_day date, p_question text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.quiz_answers where user_id = auth.uid() and day = p_day and question_id = p_question
  )
$$;

alter table public.quiz_answers enable row level security;
drop policy if exists quiz_select on public.quiz_answers;
create policy quiz_select on public.quiz_answers for select using (
  user_id = auth.uid() or (couple_id = public.my_couple_id() and public.has_quiz_answer(day, question_id))
);
drop policy if exists quiz_insert on public.quiz_answers;
create policy quiz_insert on public.quiz_answers for insert
  with check (couple_id = public.my_couple_id() and user_id = auth.uid());

-- ───────────── Zeichnungen (Plus) ─────────────
-- strokes: [{ "c": "#FF5FA2", "w": 6, "p": [[x, y], …] }] mit x/y von 0 bis 1000 (unabhängig von der Bildschirmgröße).
create table if not exists public.drawings (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple_id() references public.couples (id) on delete cascade,
  from_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  strokes jsonb not null check (jsonb_typeof(strokes) = 'array' and length(strokes::text) < 300000),
  created_at timestamptz not null default now()
);
create index if not exists drawings_couple_created on public.drawings (couple_id, created_at desc);

alter table public.drawings enable row level security;
drop policy if exists drawings_select on public.drawings;
create policy drawings_select on public.drawings for select using (couple_id = public.my_couple_id());
-- Plus-Funktion: solange Plus noch nicht kaufbar ist (app_settings.plus_enabled = false), dürfen alle malen.
drop policy if exists drawings_insert on public.drawings;
create policy drawings_insert on public.drawings for insert with check (
  couple_id = public.my_couple_id()
  and from_id = auth.uid()
  and (
    not coalesce((select plus_enabled from public.app_settings where id), false)
    or public.couple_has_plus(couple_id)
  )
);
drop policy if exists drawings_delete on public.drawings;
create policy drawings_delete on public.drawings for delete using (couple_id = public.my_couple_id() and from_id = auth.uid());

-- ───────────── Push-Benachrichtigungen ─────────────
-- Jedes Handy meldet sein Expo-Push-Token. Neue Herzen, Zettel, Antworten und Erinnerungen schicken
-- über pg_net eine Mitteilung an das Handy des Partners (Expo Push Service, exp.host).

create extension if not exists pg_net with schema extensions;

create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now()
);
create index if not exists push_tokens_user on public.push_tokens (user_id);
-- Kein direkter Zugriff: nur über die beiden Funktionen unten.
alter table public.push_tokens enable row level security;

-- Token dem angemeldeten Nutzer zuordnen. Ein Handy gehört immer nur zu einem Konto.
create or replace function public.register_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if p_token !~ '^Expo(nent)?PushToken\[.+\]$' then
    raise exception 'invalid_token';
  end if;
  insert into public.push_tokens (token, user_id, updated_at)
  values (p_token, auth.uid(), now())
  on conflict (token) do update set user_id = excluded.user_id, updated_at = now();
end;
$$;

create or replace function public.unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.push_tokens where token = p_token and user_id = auth.uid();
$$;

revoke execute on function public.register_push_token(text) from public, anon;
revoke execute on function public.unregister_push_token(text) from public, anon;
grant execute on function public.register_push_token(text) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;

-- Schickt eine Mitteilung an alle Handys des Partners von p_sender.
-- p_background: zusätzlich die App im Hintergrund wecken (z. B. um das Zeichnungs-Widget zu aktualisieren).
drop function if exists public.notify_partner(uuid, uuid, text, text, text);
create or replace function public.notify_partner(
  p_couple uuid, p_sender uuid, p_title text, p_body text, p_url text, p_background boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner uuid;
  v_messages jsonb;
begin
  select case when partner_a = p_sender then partner_b else partner_a end
    into v_partner
    from public.couples
   where id = p_couple;
  if v_partner is null then
    return;
  end if;
  select jsonb_agg(jsonb_build_object(
           'to', token,
           'title', p_title,
           'body', p_body,
           'sound', 'default',
           'data', jsonb_build_object('url', p_url),
           '_contentAvailable', p_background))
    into v_messages
    from public.push_tokens
   where user_id = v_partner;
  if v_messages is null then
    return;
  end if;
  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := v_messages,
    headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
  );
exception when others then
  -- Eine fehlgeschlagene Mitteilung darf nie das Speichern verhindern.
  raise warning 'push failed: %', sqlerrm;
end;
$$;

revoke execute on function public.notify_partner(uuid, uuid, text, text, text, boolean) from public, anon, authenticated;

create or replace function public.push_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid;
  v_name text;
  v_title text;
  v_body text;
  v_url text;
begin
  -- IF statt CASE: jede Tabelle hat andere Spalten.
  if tg_table_name = 'thoughts' then
    v_sender := new.from_id;
    -- Wer zehnmal hintereinander tippt, löst nur eine Mitteilung aus.
    if exists (
      select 1 from public.thoughts
       where from_id = new.from_id and id <> new.id and created_at > now() - interval '30 seconds'
    ) then
      return null;
    end if;
  elsif tg_table_name = 'notes' then
    v_sender := new.author_id;
  elsif tg_table_name = 'answers' then
    v_sender := new.user_id;
  elsif tg_table_name = 'memories' then
    v_sender := new.created_by;
  elsif tg_table_name = 'drawings' then
    v_sender := new.from_id;
  else
    return null;
  end if;

  select case when partner_a = v_sender then name_a else name_b end
    into v_name
    from public.couples
   where id = new.couple_id;
  v_name := coalesce(nullif(trim(v_name), ''), 'Dein Schatz');

  if tg_table_name = 'thoughts' then
    v_title := '💗 ' || v_name || ' denkt an dich';
    v_body := 'Tipp hier, um zurückzudenken.';
    v_url := '/';
  elsif tg_table_name = 'notes' then
    -- Bewusst ohne Inhalt: Mitteilungen stehen auf dem Sperrbildschirm und laufen über Expo und Apple.
    v_title := '✉️ Neuer Zettel von ' || v_name;
    v_body := 'Tipp hier, um ihn zu lesen.';
    v_url := '/notes';
  elsif tg_table_name = 'answers' then
    v_title := '❓ ' || v_name || ' hat die Frage des Tages beantwortet';
    if exists (select 1 from public.answers where couple_id = new.couple_id and day = new.day and user_id <> v_sender) then
      v_body := 'Jetzt könnt ihr beide Antworten sehen.';
    else
      v_body := 'Antworte auch, dann siehst du die Antwort.';
    end if;
    v_url := '/question';
  elsif tg_table_name = 'drawings' then
    perform public.notify_partner(
      new.couple_id, v_sender, '🎨 ' || v_name || ' hat dir etwas gemalt', 'Schau auf dein Widget oder tipp hier.', '/draw', true
    );
    return null;
  else
    v_title := '📸 Neue Erinnerung';
    v_body := v_name || ' hat einen gemeinsamen Moment festgehalten.';
    v_url := '/memories';
  end if;

  perform public.notify_partner(new.couple_id, v_sender, v_title, v_body, v_url);
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['thoughts', 'notes', 'answers', 'memories', 'drawings'] loop
    execute format('drop trigger if exists push_on_insert on public.%I', t);
    execute format(
      'create trigger push_on_insert after insert on public.%I for each row execute function public.push_on_insert()', t);
  end loop;
end;
$$;

-- ───────────── „Ich denk an dich“-Rangliste ─────────────
-- Wie oft jeder an den anderen gedacht hat: heute, diese Woche, diesen Monat, dieses Jahr (deutsche Zeit).
-- Rückgabetyp kann sich ändern – dann muss die alte Funktion erst weg.
drop function if exists public.thought_stats();
create function public.thought_stats()
returns table (from_id uuid, today bigint, week bigint, month bigint, year bigint, total bigint, best_day bigint)
language sql
stable
security definer
set search_path = public
as $$
  with local as (
    select t.from_id, (t.created_at at time zone 'Europe/Berlin') as at, (now() at time zone 'Europe/Berlin') as now
      from public.thoughts t
     where t.couple_id = public.my_couple_id()
  ),
  per_day as (
    select l.from_id, count(*) as c from local l group by l.from_id, date_trunc('day', l.at)
  )
  select l.from_id,
         count(*) filter (where l.at >= date_trunc('day', l.now)),
         count(*) filter (where l.at >= date_trunc('week', l.now)),
         count(*) filter (where l.at >= date_trunc('month', l.now)),
         count(*) filter (where l.at >= date_trunc('year', l.now)),
         count(*),
         (select max(p.c) from per_day p where p.from_id = l.from_id)
    from local l
   group by l.from_id
$$;

revoke execute on function public.thought_stats() from public, anon;
grant execute on function public.thought_stats() to authenticated;

-- Quiz: eine Mitteilung pro gespielter Runde (nicht pro Frage) – daher ein Statement-Trigger.
create or replace function public.push_on_quiz()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_name text;
  v_partner_done boolean;
begin
  for r in select distinct n.couple_id, n.user_id, n.day from new_rows n loop
    select case when partner_a = r.user_id then name_a else name_b end into v_name
      from public.couples where id = r.couple_id;
    v_name := coalesce(nullif(trim(v_name), ''), 'Dein Schatz');
    select exists (
      select 1 from public.quiz_answers q where q.couple_id = r.couple_id and q.day = r.day and q.user_id <> r.user_id
    ) into v_partner_done;
    perform public.notify_partner(
      r.couple_id,
      r.user_id,
      '🎯 ' || v_name || ' hat das Quiz gespielt',
      case when v_partner_done then 'Euer Ergebnis ist da – wer kennt wen besser?'
           else 'Du bist dran: Wie gut kennst du ' || v_name || '?' end,
      '/quiz'
    );
  end loop;
  return null;
end;
$$;

drop trigger if exists push_on_quiz on public.quiz_answers;
create trigger push_on_quiz after insert on public.quiz_answers
  referencing new table as new_rows
  for each statement execute function public.push_on_quiz();

-- ───────────── Live-Aktualisierung ─────────────

do $$
declare
  t text;
begin
  foreach t in array array['couples', 'memories', 'wishes', 'special_dates', 'notes', 'moods', 'answers', 'pack_answers', 'date_ideas', 'thoughts', 'quiz_answers', 'drawings'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;

-- Alte Einladungscodes mit Ziffern durch reine Buchstaben-Codes ersetzen (nur noch nicht verbundene Paare).
update public.couples c
   set invite_code = (
     select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ', (floor(random() * 24) + 1)::int, 1), '')
     from generate_series(1, 6)
     where c.id is not null
   )
 where partner_b is null
   and invite_code ~ '[0-9]';

-- Zur Kontrolle: Einladungscodes der Paare, die noch auf den Partner warten.
select name_a, name_b, invite_code from public.couples where partner_b is null;

-- Supabase (PostgREST) soll neue Spalten und Funktionen sofort kennen, nicht erst nach ein paar Minuten.
notify pgrst, 'reload schema';
