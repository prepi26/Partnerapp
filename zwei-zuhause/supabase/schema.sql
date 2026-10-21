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

-- Wann und wo üblicherweise übergeben wird (z. B. „17:00“, „Kita Sonnenschein“).
alter table public.families add column if not exists handover_time text not null default '';
alter table public.families add column if not exists handover_place text not null default '';
alter table public.families drop constraint if exists families_handover_time_check;
alter table public.families add constraint families_handover_time_check
  check (handover_time = '' or handover_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
alter table public.families drop constraint if exists families_handover_place_check;
alter table public.families add constraint families_handover_place_check check (length(handover_place) <= 200);

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

-- Neuer, noch unbenutzter Einladungscode (6 Großbuchstaben ohne I und O).
create or replace function public.new_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  loop
    v_code := (
      select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ', (floor(random() * 24) + 1)::int, 1), '')
      from generate_series(1, 6)
    );
    exit when not exists (select 1 from public.families where invite_code = v_code);
  end loop;
  return v_code;
end;
$$;

-- Schutz gegen Durchprobieren von Codes: höchstens 10 Versuche pro Stunde und Konto.
create table if not exists public.code_attempts (
  user_id uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now()
);
create index if not exists code_attempts_user on public.code_attempts (user_id, at);
alter table public.code_attempts enable row level security;

create or replace function public.count_code_attempt()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.code_attempts where at < now() - interval '1 day';
  if (select count(*) from public.code_attempts where user_id = auth.uid() and at > now() - interval '1 hour') >= 10 then
    raise exception 'too_many_attempts';
  end if;
  insert into public.code_attempts (user_id) values (auth.uid());
end;
$$;

revoke execute on function public.new_invite_code() from public, anon, authenticated;
revoke execute on function public.count_code_attempt() from public, anon, authenticated;

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
  if public.is_professional() then
    raise exception 'is_professional';
  end if;
  v_code := public.new_invite_code();
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
  if public.is_professional() then
    raise exception 'is_professional';
  end if;
  perform public.count_code_attempt();
  -- Nach dem Beitritt bekommt die Familie einen neuen Code: Der alte taugt nie wieder, auch wenn der Platz frei wird.
  update public.families
     set parent_b = auth.uid(), invite_code = public.new_invite_code()
   where invite_code = upper(trim(p_code))
     and parent_b is null
     and parent_a is not null
     and parent_a <> auth.uid()
  returning id into v_id;
  -- Bei falschem Code null statt Fehler, damit der Versuch gezählt bleibt.
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

-- Den Einladungscode lesen nur die Eltern selbst (per Funktion) – nicht eingeladene Fachkräfte.
revoke select on public.families from authenticated;
grant select (id, parent_a, parent_b, name_a, name_b, children, schedule_model, schedule_start, schedule_first,
              default_share_a, handover_time, handover_place, created_at) on public.families to authenticated;

create or replace function public.my_invite_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select invite_code from public.families where parent_a = auth.uid() or parent_b = auth.uid() limit 1
$$;

-- Wer zur Familie gehört und der Code sind tabu; Namen, Kinder und Umgangsplan dürfen beide ändern.
revoke update on public.families from authenticated;
grant update (name_a, name_b, children, schedule_model, schedule_start, schedule_first, default_share_a,
              handover_time, handover_place)
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

-- Mehrbedarf (regelmäßig, z. B. Kita, Nachhilfe) und Sonderbedarf (unvorhersehbar, hoch) – nur zur Orientierung.
alter table public.expenses add column if not exists need text not null default 'regular';
alter table public.expenses drop constraint if exists expenses_need_check;
alter table public.expenses add constraint expenses_need_check check (need in ('regular', 'mehrbedarf', 'sonderbedarf'));

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

drop index if exists public.messages_family_seq;
create unique index if not exists messages_family_seq_key on public.messages (family_id, seq);

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
  -- Reihenfolge erst nach der Sperre vergeben – sonst passt die Prüfsummen-Kette nicht zur Anzeige.
  new.seq := nextval(pg_get_serial_sequence('public.messages', 'seq'));
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
revoke insert, update, delete on public.messages from authenticated;
-- Nur der Text kommt vom Gerät; Absender, Zeit, Reihenfolge und Prüfsumme setzt der Server.
grant insert (text) on public.messages to authenticated;

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

-- ───────────── Server-Zeitstempel ─────────────
-- Beim Einfügen setzt der Server Verfasser und Zeit und leert Antwortfelder – vom Gerät kommt nur der Inhalt.

create or replace function public.force_insert_meta()
returns trigger
language plpgsql
as $$
begin
  new.created_by := auth.uid();
  new.created_at := now();
  if tg_table_name = 'handovers' then
    new.reply := null;
    new.reply_note := '';
    new.replied_at := null;
  elsif tg_table_name = 'decisions' then
    new.status := 'proposed';
    new.answer_note := '';
    new.answered_at := null;
  elsif tg_table_name = 'expenses' then
    new.status := 'open';
    new.answered_at := null;
  elsif tg_table_name = 'schedule_changes' then
    new.status := 'proposed';
    new.answered_at := null;
  end if;
  return new;
end;
$$;

-- ───────────── Infos zum Kind ─────────────
-- Ärzte, Schule, Allergien, Größen … beide pflegen dieselbe Liste; wer zuletzt geändert hat, steht dabei.

create table if not exists public.child_info (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null default public.my_family_id() references public.families (id) on delete cascade,
  category text not null default 'sonstiges',
  label text not null check (length(label) between 1 and 100),
  value text not null default '' check (length(value) <= 2000),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.child_info enable row level security;
drop policy if exists child_info_family on public.child_info;
create policy child_info_family on public.child_info for all
  using (family_id = public.my_family_id()) with check (family_id = public.my_family_id());

create or replace function public.child_info_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists child_info_touch on public.child_info;
create trigger child_info_touch before insert or update on public.child_info
  for each row execute function public.child_info_touch();

-- ───────────── Entscheidungen ─────────────
-- „Angelegenheiten von erheblicher Bedeutung“ (§ 1687 BGB) brauchen bei gemeinsamer Sorge beide Eltern:
-- Schulwahl, Operation, Auslandsreise … Ein Elternteil fragt, der andere stimmt zu oder lehnt ab.

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null default public.my_family_id() references public.families (id) on delete cascade,
  category text not null default 'sonstiges',
  title text not null check (length(title) between 1 and 200),
  details text not null default '' check (length(details) <= 4000),
  due_date date,
  status text not null default 'proposed' check (status in ('proposed', 'agreed', 'rejected')),
  answer_note text not null default '' check (length(answer_note) <= 2000),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

alter table public.decisions enable row level security;
drop policy if exists decisions_select on public.decisions;
create policy decisions_select on public.decisions for select using (family_id = public.my_family_id());
drop policy if exists decisions_insert on public.decisions;
create policy decisions_insert on public.decisions
  for insert with check (family_id = public.my_family_id() and created_by = auth.uid() and status = 'proposed');
drop policy if exists decisions_delete on public.decisions;
create policy decisions_delete on public.decisions
  for delete using (created_by = auth.uid() and status = 'proposed');

create or replace function public.answer_decision(p_id uuid, p_agree boolean, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.decisions
     set status = case when p_agree then 'agreed' else 'rejected' end,
         answer_note = left(coalesce(p_note, ''), 2000),
         answered_at = now()
   where id = p_id
     and family_id = public.my_family_id()
     and status = 'proposed'
     and created_by is distinct from auth.uid();
  if not found then
    raise exception 'not_allowed';
  end if;
end;
$$;

-- ───────────── Übergaben ─────────────
-- Was tatsächlich passiert ist: pünktlich, verspätet, ausgefallen. Der andere kann bestätigen oder widersprechen.

create table if not exists public.handovers (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null default public.my_family_id() references public.families (id) on delete cascade,
  day date not null,
  status text not null check (status in ('on_time', 'late', 'missed')),
  minutes_late int not null default 0 check (minutes_late between 0 and 1440),
  note text not null default '' check (length(note) <= 1000),
  reply text check (reply in ('confirmed', 'disputed')),
  reply_note text not null default '' check (length(reply_note) <= 1000),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  replied_at timestamptz
);

alter table public.handovers enable row level security;
drop policy if exists handovers_select on public.handovers;
create policy handovers_select on public.handovers for select using (family_id = public.my_family_id());
drop policy if exists handovers_insert on public.handovers;
create policy handovers_insert on public.handovers
  for insert with check (family_id = public.my_family_id() and created_by = auth.uid() and reply is null);
-- Nachweise bleiben: kein Bearbeiten und kein Löschen.

create or replace function public.reply_handover(p_id uuid, p_confirm boolean, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.handovers
     set reply = case when p_confirm then 'confirmed' else 'disputed' end,
         reply_note = left(coalesce(p_note, ''), 1000),
         replied_at = now()
   where id = p_id
     and family_id = public.my_family_id()
     and reply is null
     and created_by is distinct from auth.uid();
  if not found then
    raise exception 'not_allowed';
  end if;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['schedule_changes', 'expenses', 'decisions', 'handovers'] loop
    execute format('drop trigger if exists force_insert_meta on public.%I', t);
    execute format(
      'create trigger force_insert_meta before insert on public.%I for each row execute function public.force_insert_meta()', t
    );
  end loop;
end;
$$;

-- ───────────── Elternvereinbarung ─────────────
-- Jede Änderung ist eine neue Version. Wer sie schreibt, stimmt ihr damit zu; der andere stimmt per Funktion zu.
-- Versionen werden nie geändert – die Prüfsumme belegt den Wortlaut, dem beide zugestimmt haben.

create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null default public.my_family_id() references public.families (id) on delete cascade,
  version int not null default 1,
  content jsonb not null,
  hash text not null default '',
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_a_at timestamptz,
  accepted_b_at timestamptz
);

create or replace function public.agreements_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('agreement' || new.family_id::text));
  new.created_by := auth.uid();
  new.created_at := now();
  new.version := coalesce((select max(version) from public.agreements where family_id = new.family_id), 0) + 1;
  new.accepted_a_at := case when public.my_parent_key() = 'a' then now() end;
  new.accepted_b_at := case when public.my_parent_key() = 'b' then now() end;
  new.hash := encode(extensions.digest(new.content::text, 'sha256'), 'hex');
  return new;
end;
$$;

drop trigger if exists agreements_before_insert on public.agreements;
create trigger agreements_before_insert before insert on public.agreements
  for each row execute function public.agreements_before_insert();

alter table public.agreements enable row level security;
drop policy if exists agreements_select on public.agreements;
create policy agreements_select on public.agreements for select using (family_id = public.my_family_id());
drop policy if exists agreements_insert on public.agreements;
create policy agreements_insert on public.agreements for insert with check (family_id = public.my_family_id());
revoke update, delete on public.agreements from authenticated;

create or replace function public.accept_agreement(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := public.my_parent_key();
begin
  -- Zustimmen geht nur zur neuesten Version.
  update public.agreements a
     set accepted_a_at = case when v_key = 'a' then coalesce(accepted_a_at, now()) else accepted_a_at end,
         accepted_b_at = case when v_key = 'b' then coalesce(accepted_b_at, now()) else accepted_b_at end
   where a.id = p_id
     and a.family_id = public.my_family_id()
     and a.version = (select max(version) from public.agreements where family_id = a.family_id);
  if not found then
    raise exception 'not_allowed';
  end if;
end;
$$;

-- ───────────── Zugang für Fachkräfte ─────────────
-- Jugendamt, Beratungsstelle, Verfahrensbeistand oder Anwalt bekommen einen befristeten Lesezugang:
-- Kalender, Kosten, Nachrichten, Entscheidungen, Übergaben, Vereinbarung. Nie das private Tagebuch.
-- Ein Elternteil lädt ein; ist der andere verbunden, muss er zustimmen. Beide können jederzeit widerrufen.

create table if not exists public.professional_access (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null default public.my_family_id() references public.families (id) on delete cascade,
  label text not null check (length(label) between 1 and 200),
  code text not null unique,
  invited_by uuid default auth.uid() references auth.users (id) on delete set null,
  invited_key text not null check (invited_key in ('a', 'b')),
  other_approved_at timestamptz,
  professional uuid references auth.users (id) on delete set null,
  joined_at timestamptz,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists professional_access_professional on public.professional_access (professional);

alter table public.professional_access enable row level security;
drop policy if exists professional_access_select on public.professional_access;
create policy professional_access_select on public.professional_access
  for select using (family_id = public.my_family_id() or professional = auth.uid());
revoke insert, update, delete on public.professional_access from authenticated;

-- Familien, die der eingeloggte Nutzer als Fachkraft gerade lesen darf.
create or replace function public.my_case_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select pa.family_id
    from public.professional_access pa
    join public.families f on f.id = pa.family_id
   where pa.professional = auth.uid()
     and pa.revoked_at is null
     and pa.expires_at > now()
     and (pa.other_approved_at is not null
          or (pa.invited_key = 'a' and f.parent_b is null)
          or (pa.invited_key = 'b' and f.parent_a is null))
$$;

create or replace function public.is_professional()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.professional_access where professional = auth.uid())
$$;

create or replace function public.create_professional_invite(p_label text, p_days int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_family uuid := public.my_family_id();
begin
  if v_family is null then
    raise exception 'not_allowed';
  end if;
  loop
    v_code := (
      select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random() * 32) + 1)::int, 1), '')
      from generate_series(1, 8)
    );
    exit when not exists (select 1 from public.professional_access where code = v_code);
  end loop;
  insert into public.professional_access (family_id, label, code, invited_key, expires_at)
  values (v_family, left(trim(p_label), 200), v_code, public.my_parent_key(),
          now() + make_interval(days => least(greatest(coalesce(p_days, 30), 1), 365)));
  return v_code;
end;
$$;

create or replace function public.approve_professional(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.professional_access
     set other_approved_at = now()
   where id = p_id
     and family_id = public.my_family_id()
     and invited_key <> public.my_parent_key()
     and other_approved_at is null
     and revoked_at is null;
  if not found then
    raise exception 'not_allowed';
  end if;
end;
$$;

create or replace function public.revoke_professional(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.professional_access
     set revoked_at = now()
   where id = p_id
     and (family_id = public.my_family_id() or professional = auth.uid())
     and revoked_at is null;
  if not found then
    raise exception 'not_allowed';
  end if;
end;
$$;

create or replace function public.join_as_professional(p_code text)
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
    raise exception 'is_parent';
  end if;
  perform public.count_code_attempt();
  -- Ein Code gilt genau einmal (joined_at), auch wenn das Fachkraft-Konto später gelöscht wird.
  update public.professional_access
     set professional = auth.uid(), joined_at = now()
   where code = upper(trim(p_code))
     and professional is null
     and joined_at is null
     and revoked_at is null
     and expires_at > now()
  returning family_id into v_id;
  return v_id;
end;
$$;

-- Lesezugriff der Fachkraft auf die freigegebenen Bereiche (nur lesen, nie das Tagebuch).
do $$
declare
  t text;
begin
  foreach t in array array['schedule_changes', 'expenses', 'messages', 'child_info', 'decisions', 'handovers', 'agreements'] loop
    execute format('drop policy if exists %I on public.%I', t || '_professional', t);
    execute format(
      'create policy %I on public.%I for select using (family_id in (select public.my_case_ids()))',
      t || '_professional', t
    );
  end loop;
end;
$$;

drop policy if exists families_professional on public.families;
create policy families_professional on public.families
  for select using (id in (select public.my_case_ids()));

-- ───────────── Belege (Fotos) ─────────────

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Lesen und Hochladen für beide Eltern. Kein Überschreiben. Löschen nur eigene Belege, die zu keiner bestätigten
-- Ausgabe gehören – oder alles, wenn man als letzter Elternteil übrig ist (Konto löschen).
drop policy if exists receipts_family on storage.objects;
drop policy if exists receipts_select on storage.objects;
create policy receipts_select on storage.objects for select
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = public.my_family_id()::text);
drop policy if exists receipts_insert on storage.objects;
create policy receipts_insert on storage.objects for insert
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = public.my_family_id()::text);
drop policy if exists receipts_delete on storage.objects;
create policy receipts_delete on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = public.my_family_id()::text
    and (
      not public.other_parent_present()
      or (owner_id = auth.uid()::text
          and not exists (select 1 from public.expenses e where e.receipt_path = name and e.status = 'confirmed'))
    )
  );

drop policy if exists receipts_professional on storage.objects;
create policy receipts_professional on storage.objects for select
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] in (select public.my_case_ids()::text));

-- ───────────── Live-Updates ─────────────

do $$
declare
  t text;
begin
  foreach t in array array['families', 'schedule_changes', 'expenses', 'messages', 'child_info', 'decisions', 'handovers', 'agreements', 'professional_access'] loop
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
  update public.professional_access set revoked_at = now() where professional = auth.uid() and revoked_at is null;
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
    'answer_expense(uuid, boolean)', 'mark_messages_read()', 'delete_my_account()',
    'answer_decision(uuid, boolean, text)', 'reply_handover(uuid, boolean, text)', 'accept_agreement(uuid)',
    'create_professional_invite(text, int)', 'approve_professional(uuid)', 'revoke_professional(uuid)',
    'join_as_professional(text)', 'my_invite_code()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

-- ───────────── Push-Mitteilungen ─────────────
-- Jedes Handy meldet sein Expo-Push-Token. Neue Nachrichten, Anfragen und Antworten schicken über pg_net
-- eine Mitteilung an den anderen Elternteil (Expo Push Service, exp.host). Bewusst ohne Inhalt –
-- Mitteilungen stehen auf dem Sperrbildschirm und laufen über Expo und Apple/Google.

create extension if not exists pg_net with schema extensions;

create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now()
);
create index if not exists push_tokens_user on public.push_tokens (user_id);
-- Kein direkter Zugriff: nur über die beiden Funktionen unten.
alter table public.push_tokens enable row level security;

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

-- Schickt eine Mitteilung an alle Handys des anderen Elternteils (aus Sicht von p_sender).
create or replace function public.notify_other(p_family uuid, p_sender uuid, p_title text, p_body text, p_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_other uuid;
  v_messages jsonb;
begin
  select case when parent_a = p_sender then parent_b else parent_a end
    into v_other
    from public.families
   where id = p_family;
  if v_other is null or p_sender is null then
    return;
  end if;
  select jsonb_agg(jsonb_build_object(
           'to', token, 'title', p_title, 'body', p_body, 'sound', 'default',
           'data', jsonb_build_object('url', p_url)))
    into v_messages
    from public.push_tokens
   where user_id = v_other;
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

revoke execute on function public.notify_other(uuid, uuid, text, text, text) from public, anon, authenticated;

create or replace function public.push_on_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid := auth.uid();
  v_name text;
  v_title text;
  v_body text := 'Tipp hier, um es anzusehen.';
  v_url text := '/';
begin
  select case when parent_a = v_sender then name_a else name_b end
    into v_name
    from public.families
   where id = new.family_id;
  v_name := coalesce(nullif(trim(v_name), ''), 'Der andere Elternteil');

  if tg_table_name = 'messages' then
    v_title := '💬 Neue Nachricht von ' || v_name;
    v_body := 'Tipp hier, um sie zu lesen.';
    v_url := '/messages';
  elsif tg_table_name = 'schedule_changes' then
    v_url := '/calendar';
    if tg_op = 'INSERT' then
      v_title := '📅 ' || v_name || ' schlägt eine Änderung im Umgang vor';
    elsif new.status = 'accepted' then
      v_title := '✅ ' || v_name || ' hat deinem Vorschlag zugestimmt';
    else
      v_title := '❌ ' || v_name || ' hat deinen Vorschlag abgelehnt';
    end if;
  elsif tg_table_name = 'expenses' then
    v_url := '/expenses';
    if tg_op = 'INSERT' then
      v_title := '💶 ' || v_name || ' hat eine Ausgabe eingetragen';
      v_body := 'Bitte prüfen und bestätigen.';
    elsif new.status = 'confirmed' then
      v_title := '✅ ' || v_name || ' hat eine Ausgabe bestätigt';
    else
      v_title := '❌ ' || v_name || ' hat eine Ausgabe abgelehnt';
    end if;
  elsif tg_table_name = 'decisions' then
    v_url := '/decisions';
    if tg_op = 'INSERT' then
      v_title := '🤝 ' || v_name || ' bittet um eine Entscheidung';
    elsif new.status = 'agreed' then
      v_title := '✅ ' || v_name || ' hat zugestimmt';
    else
      v_title := '❌ ' || v_name || ' hat nicht zugestimmt';
    end if;
  elsif tg_table_name = 'handovers' then
    v_url := '/handovers';
    if tg_op = 'INSERT' then
      v_title := '🚗 ' || v_name || ' hat eine Übergabe eingetragen';
    else
      v_title := '🚗 ' || v_name || ' hat auf deinen Übergabe-Eintrag geantwortet';
    end if;
  elsif tg_table_name = 'agreements' then
    v_url := '/agreement';
    if tg_op = 'INSERT' then
      v_title := '📝 ' || v_name || ' hat die Elternvereinbarung bearbeitet';
      v_body := 'Lies die neue Fassung und stimme zu, wenn sie für dich passt.';
    else
      v_title := '📝 ' || v_name || ' hat der Elternvereinbarung zugestimmt';
    end if;
  elsif tg_table_name = 'professional_access' then
    v_url := '/professionals';
    v_title := '🔐 ' || v_name || ' möchte eine Fachkraft einladen';
    v_body := new.label || ' – bitte zustimmen oder ablehnen.';
  else
    return null;
  end if;

  perform public.notify_other(new.family_id, v_sender, v_title, v_body, v_url);
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['messages', 'schedule_changes', 'expenses', 'decisions', 'handovers', 'agreements', 'professional_access'] loop
    execute format('drop trigger if exists push_on_insert on public.%I', t);
    execute format(
      'create trigger push_on_insert after insert on public.%I for each row execute function public.push_on_change()', t
    );
  end loop;
end;
$$;

-- Antworten lösen nur beim Wechsel von „offen“ zu „beantwortet“ eine Mitteilung aus.
drop trigger if exists push_on_answer on public.schedule_changes;
create trigger push_on_answer after update of status on public.schedule_changes
  for each row when (old.status = 'proposed' and new.status <> 'proposed') execute function public.push_on_change();
drop trigger if exists push_on_answer on public.expenses;
create trigger push_on_answer after update of status on public.expenses
  for each row when (old.status = 'open' and new.status <> 'open') execute function public.push_on_change();
drop trigger if exists push_on_answer on public.decisions;
create trigger push_on_answer after update of status on public.decisions
  for each row when (old.status = 'proposed' and new.status <> 'proposed') execute function public.push_on_change();
drop trigger if exists push_on_answer on public.handovers;
create trigger push_on_answer after update of reply on public.handovers
  for each row when (old.reply is null and new.reply is not null) execute function public.push_on_change();
drop trigger if exists push_on_answer on public.agreements;
create trigger push_on_answer after update on public.agreements
  for each row when ((old.accepted_a_at is null and new.accepted_a_at is not null)
                  or (old.accepted_b_at is null and new.accepted_b_at is not null))
  execute function public.push_on_change();
