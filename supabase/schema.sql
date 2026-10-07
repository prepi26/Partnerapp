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
    -- 6 Zeichen ohne verwechselbare Zeichen (0/O, 1/I).
    v_code := (
      select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random() * 32) + 1)::int, 1), '')
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

-- ───────────── Live-Aktualisierung ─────────────

do $$
declare
  t text;
begin
  foreach t in array array['couples', 'memories', 'wishes', 'special_dates', 'notes', 'moods', 'answers', 'pack_answers', 'date_ideas', 'thoughts'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
