-- "Zwei Zuhause" – Datenbank für Supabase (eigenes Projekt, nicht das von „Wir zwei“).
-- Einmal komplett im Supabase SQL Editor ausführen. Kann gefahrlos erneut ausgeführt werden.

create extension if not exists pgcrypto with schema extensions;

-- ───────────── Familien ─────────────
-- Eine Familie = zwei Elternteile (a legt an, b tritt mit Code bei) und ihre Kinder.
-- Löscht ein Elternteil sein Konto, bleibt die Familie für den anderen erhalten (Nachweise!).

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  parent_a uuid references auth.users (id) on delete set null,
  parent_b uuid references auth.users (id) on delete set null,
  name_a text not null,
  name_b text not null,
  children text not null default '',
  invite_code text not null unique,
  -- Umgangsmodell: none | wechsel_7_7 | wechsel_2_2_5_5 | wechsel_2_2_3 | residenz_we
  schedule_model text not null default 'none',
  schedule_start date not null default current_date,
  schedule_first text not null default 'a' check (schedule_first in ('a', 'b')),
  -- Anteil von Elternteil a an gemeinsamen Kosten in Prozent (Vorschlag beim Eintragen).
  default_share_a int not null default 50 check (default_share_a between 0 and 100),
  created_at timestamptz not null default now()
);

alter table public.families drop constraint if exists families_schedule_model_check;
alter table public.families add constraint families_schedule_model_check
  check (schedule_model in ('none', 'wechsel_7_7', 'wechsel_2_2_5_5', 'wechsel_2_2_3', 'residenz_we'));

create unique index if not exists families_parent_a_key on public.families (parent_a);
create unique index if not exists families_parent_b_key on public.families (parent_b);

create or replace function public.my_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.families
  where parent_a = auth.uid() or parent_b = auth.uid()
  limit 1
$$;

-- 'a' oder 'b' – welcher Elternteil der eingeloggte Nutzer ist.
create or replace function public.my_parent_key()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case when parent_a = auth.uid() then 'a' else 'b' end
  from public.families
  where parent_a = auth.uid() or parent_b = auth.uid()
  limit 1
$$;

-- Ist der andere Elternteil (noch) dabei? Sonst darf man eigene Vorschläge selbst bestätigen.
create or replace function public.other_parent_present()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case when parent_a = auth.uid() then parent_b is not null else parent_a is not null end
  from public.families
  where parent_a = auth.uid() or parent_b = auth.uid()
  limit 1
$$;

create or replace function public.create_family(p_name_a text, p_name_b text, p_children text)
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
  if public.my_family_id() is not null then
    raise exception 'already_in_family';
  end if;
  loop
    v_code := (
      select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ', (floor(random() * 24) + 1)::int, 1), '')
      from generate_series(1, 6)
    );
    exit when not exists (select 1 from public.families where invite_code = v_code);
  end loop;
  insert into public.families (parent_a, name_a, name_b, children, invite_code)
  values (auth.uid(), p_name_a, p_name_b, coalesce(p_children, ''), v_code);
  return v_code;
end;
$$;

create or replace function public.join_family(p_code text)
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
  if public.my_family_id() is not null then
    raise exception 'already_in_family';
  end if;
  update public.families
     set parent_b = auth.uid()
   where invite_code = upper(trim(p_code))
     and parent_b is null
     and parent_a is not null
     and parent_a <> auth.uid()
  returning id into v_id;
  if v_id is null then
    raise exception 'invalid_code';
  end if;
  return v_id;
end;
$$;

alter table public.families enable row level security;

drop policy if exists families_select on public.families;
create policy families_select on public.families
  for select using (parent_a = auth.uid() or parent_b = auth.uid());

drop policy if exists families_update on public.families;
create policy families_update on public.families
  for update using (parent_a = auth.uid() or parent_b = auth.uid())
  with check (parent_a = auth.uid() or parent_b = auth.uid());

-- Wer zur Familie gehört und der Code sind tabu; Namen, Kinder und Umgangsplan dürfen beide ändern.
revoke update on public.families from authenticated;
grant update (name_a, name_b, children, schedule_model, schedule_start, schedule_first, default_share_a)
  on public.families to authenticated;

-- ───────────── Umgang: Ausnahmen und Tausch ─────────────
-- Ein Eintrag sagt: An diesem Tag ist das Kind bei <parent>. Der andere Elternteil muss zustimmen.

create table if not exists public.schedule_changes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null default public.my_family_id() references public.families (id) on delete cascade,
  day date not null,
  parent text not null check (parent in ('a', 'b')),
  note text not null default '' check (length(note) <= 500),
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'declined')),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

alter table public.schedule_changes enable row level security;
drop policy if exists schedule_changes_select on public.schedule_changes;
create policy schedule_changes_select on public.schedule_changes
  for select using (family_id = public.my_family_id());
drop policy if exists schedule_changes_insert on public.schedule_changes;
create policy schedule_changes_insert on public.schedule_changes
  for insert with check (family_id = public.my_family_id() and created_by = auth.uid() and status = 'proposed');
-- Nur offene, eigene Vorschläge darf man zurückziehen.
drop policy if exists schedule_changes_delete on public.schedule_changes;
create policy schedule_changes_delete on public.schedule_changes
  for delete using (created_by = auth.uid() and status = 'proposed');

create or replace function public.answer_schedule_change(p_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.schedule_changes
     set status = case when p_accept then 'accepted' else 'declined' end,
         answered_at = now()
   where id = p_id
     and family_id = public.my_family_id()
     and status = 'proposed'
     and (created_by is distinct from auth.uid() or not public.other_parent_present());
  if not found then
    raise exception 'not_allowed';
  end if;
end;
$$;

-- ───────────── Kosten fürs Kind ─────────────
-- kind = 'expense': paid_by hat bezahlt, share_a % davon trägt Elternteil a.
-- kind = 'payment': Ausgleichszahlung von paid_by an den anderen Elternteil.

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null default public.my_family_id() references public.families (id) on delete cascade,
  kind text not null default 'expense' check (kind in ('expense', 'payment')),
  title text not null check (length(title) between 1 and 200),
  category text not null default 'sonstiges',
  amount_cents int not null check (amount_cents > 0 and amount_cents <= 100000000),
  day date not null,
  paid_by text not null check (paid_by in ('a', 'b')),
  share_a int not null default 50 check (share_a between 0 and 100),
  receipt_path text,
  status text not null default 'open' check (status in ('open', 'confirmed', 'disputed')),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

alter table public.expenses enable row level security;
drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses for select using (family_id = public.my_family_id());
drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses
  for insert with check (family_id = public.my_family_id() and created_by = auth.uid() and status = 'open');
-- Bestätigte Kosten bleiben stehen; nur Offenes oder Abgelehntes darf der Verfasser löschen.
drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete on public.expenses
  for delete using (created_by = auth.uid() and status <> 'confirmed');

create or replace function public.answer_expense(p_id uuid, p_confirm boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.expenses
     set status = case when p_confirm then 'confirmed' else 'disputed' end,
         answered_at = now()
   where id = p_id
     and family_id = public.my_family_id()
     and status = 'open'
     and created_by is distinct from auth.uid();
  if not found then
    raise exception 'not_allowed';
  end if;
end;
$$;

-- ───────────── Nachrichten (unveränderlich) ─────────────
-- Kein Bearbeiten, kein Löschen. Jede Nachricht trägt eine Prüfsumme über die vorherige –
-- so fällt auf, wenn in der Datenbank nachträglich etwas verändert würde.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  seq bigserial,
  family_id uuid not null default public.my_family_id() references public.families (id) on delete cascade,
  sender uuid default auth.uid() references auth.users (id) on delete set null,
  sender_key text not null default 'a' check (sender_key in ('a', 'b')),
  text text not null check (length(text) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  hash text not null default ''
);

create index if not exists messages_family_seq on public.messages (family_id, seq);

create or replace function public.messages_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev text;
begin
  -- Mehrere gleichzeitige Nachrichten derselben Familie nacheinander verketten.
  perform pg_advisory_xact_lock(hashtext(new.family_id::text));
  new.sender := auth.uid();
  new.sender_key := public.my_parent_key();
  new.created_at := now();
  new.read_at := null;
  select hash into v_prev from public.messages
   where family_id = new.family_id order by seq desc limit 1;
  new.hash := encode(
    extensions.digest(
      coalesce(v_prev, '') || '|' || new.sender_key || '|' || to_char(new.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || '|' || new.text,
      'sha256'
    ),
    'hex'
  );
  return new;
end;
$$;

drop trigger if exists messages_before_insert on public.messages;
create trigger messages_before_insert before insert on public.messages
  for each row execute function public.messages_before_insert();

alter table public.messages enable row level security;
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select using (family_id = public.my_family_id());
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert with check (family_id = public.my_family_id());
revoke update, delete on public.messages from authenticated;

-- Gelesen-Markierung setzt nur der Empfänger, und nur einmal.
create or replace function public.mark_messages_read()
returns void
language sql
security definer
set search_path = public
as $$
  update public.messages
     set read_at = now()
   where family_id = public.my_family_id()
     and sender_key <> public.my_parent_key()
     and read_at is null
$$;

-- ───────────── Tagebuch (nur für mich) ─────────────
-- Private Notizen für die eigene Dokumentation – der andere Elternteil sieht sie nie.

create table if not exists public.journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  text text not null check (length(text) between 1 and 8000),
  created_at timestamptz not null default now()
);

alter table public.journal enable row level security;
drop policy if exists journal_own on public.journal;
create policy journal_own on public.journal for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ───────────── Belege (Fotos) ─────────────

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists receipts_family on storage.objects;
create policy receipts_family on storage.objects for all
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = public.my_family_id()::text)
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = public.my_family_id()::text);

-- ───────────── Live-Updates ─────────────

do $$
declare
  t text;
begin
  foreach t in array array['families', 'schedule_changes', 'expenses', 'messages'] loop
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;

-- ───────────── Konto löschen (Pflicht für den App Store) ─────────────
-- Löscht das eigene Konto und das eigene Tagebuch. Die gemeinsame Familie (Kalender, Kosten,
-- Nachrichten) bleibt für den anderen Elternteil erhalten – sie ist auch seine Dokumentation.
-- Ist niemand mehr übrig, wird die Familie gelöscht. Belege löscht die App vorher über die Storage-API.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family uuid := public.my_family_id();
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  delete from auth.users where id = auth.uid();
  if v_family is not null then
    delete from public.families where id = v_family and parent_a is null and parent_b is null;
  end if;
end;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'create_family(text, text, text)', 'join_family(text)', 'answer_schedule_change(uuid, boolean)',
    'answer_expense(uuid, boolean)', 'mark_messages_read()', 'delete_my_account()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;
