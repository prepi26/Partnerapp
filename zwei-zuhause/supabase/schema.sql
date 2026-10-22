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

-- Lesebestätigungen je Elternteil (wechselseitig: wer sie ausschaltet, sieht sie beim anderen auch nicht).
alter table public.families add column if not exists read_receipts_a boolean not null default true;
alter table public.families add column if not exists read_receipts_b boolean not null default true;

-- Abo „Zwei Zuhause Plus“ gilt für die ganze Familie. plus_until setzt nur die Edge Function (service_role).
alter table public.families add column if not exists plus_until timestamptz;

-- Wann der zweite Elternteil beigetreten ist: Ab da laufen die 14 Testtage (nur beim ersten Beitritt gesetzt).
alter table public.families add column if not exists joined_at timestamptz;
update public.families set joined_at = created_at where parent_b is not null and joined_at is null;

-- Bundesland bzw. Region der Schule (z. B. 'DE-NW', 'AT-9') für die Schulferien im Kalender; leer = keine.
alter table public.families add column if not exists school_state text not null default '';
alter table public.families drop constraint if exists families_school_state_check;
alter table public.families add constraint families_school_state_check
  check (school_state = '' or school_state ~ '^(DE|AT)-[A-Z0-9]{1,2}$');

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

-- Darf die Familie gerade schreiben? Allein höchstens 30 Tage ab Anlegen kostenlos; sobald der andere Elternteil
-- beitritt, 14 Testtage ab dem Beitritt. Danach nur mit Abo – sonst nur lesen.
-- Lesen, Exportieren, eigene Einträge löschen und das Konto löschen gehen immer (DSGVO).
-- Muss zu src/data/plus.tsx (SOLO_DAYS, TRIAL_DAYS) passen.
create or replace function public.family_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.families
     where id = public.my_family_id()
       and (plus_until > now()
            or (joined_at is null and created_at + interval '30 days' > now())
            or joined_at + interval '14 days' > now())
  )
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
     set parent_b = auth.uid(), invite_code = public.new_invite_code(), joined_at = coalesce(joined_at, now())
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
  with check ((parent_a = auth.uid() or parent_b = auth.uid()) and public.family_active());

-- Den Einladungscode lesen nur die Eltern selbst (per Funktion) – nicht eingeladene Fachkräfte.
revoke select on public.families from authenticated;
grant select (id, parent_a, parent_b, name_a, name_b, children, schedule_model, schedule_start, schedule_first,
              default_share_a, handover_time, handover_place, read_receipts_a, read_receipts_b, plus_until, joined_at,
              school_state, created_at)
  on public.families to authenticated;

create or replace function public.my_invite_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select invite_code from public.families where parent_a = auth.uid() or parent_b = auth.uid() limit 1
$$;

-- Jeder schaltet nur seine eigenen Lesebestätigungen.
create or replace function public.set_read_receipts(p_on boolean)
returns void
language sql
security definer
set search_path = public
as $$
  update public.families
     set read_receipts_a = case when parent_a = auth.uid() then p_on else read_receipts_a end,
         read_receipts_b = case when parent_b = auth.uid() then p_on else read_receipts_b end
   where parent_a = auth.uid() or parent_b = auth.uid()
$$;

-- Wer zur Familie gehört und der Code sind tabu; Namen, Kinder und Umgangsplan dürfen beide ändern.
revoke update on public.families from authenticated;
grant update (name_a, name_b, children, schedule_model, schedule_start, schedule_first, default_share_a,
              handover_time, handover_place, school_state)
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
  for insert with check (
    family_id = public.my_family_id() and created_by = auth.uid() and status = 'proposed' and public.family_active()
  );
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
  if not public.family_active() then
    raise exception 'subscription_required';
  end if;
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
  for insert with check (
    family_id = public.my_family_id() and created_by = auth.uid() and status = 'open' and public.family_active()
  );
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
  if not public.family_active() then
    raise exception 'subscription_required';
  end if;
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
create policy messages_insert on public.messages
  for insert with check (family_id = public.my_family_id() and public.family_active());
revoke insert, update, delete on public.messages from authenticated;
-- Nur der Text kommt vom Gerät; Absender, Zeit, Reihenfolge und Prüfsumme setzt der Server.
grant insert (text) on public.messages to authenticated;

-- Gelesen-Markierung setzt nur der Empfänger, nur einmal – und nur, wenn er Lesebestätigungen eingeschaltet hat.
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
     and exists (
       select 1 from public.families f
        where f.id = public.my_family_id()
          and case when f.parent_a = auth.uid() then f.read_receipts_a else f.read_receipts_b end
     )
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
drop policy if exists journal_select on public.journal;
create policy journal_select on public.journal for select using (user_id = auth.uid());
drop policy if exists journal_insert on public.journal;
create policy journal_insert on public.journal
  for insert with check (user_id = auth.uid() and public.family_active());
drop policy if exists journal_delete on public.journal;
create policy journal_delete on public.journal for delete using (user_id = auth.uid());

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
  elsif tg_table_name = 'maintenance_payments' then
    -- Trägt der Empfänger ein, hat er das Geld erhalten; trägt der Zahlende ein, bestätigt der andere.
    if new.payer = public.my_parent_key() then
      new.status := 'open';
      new.answered_at := null;
    else
      new.status := 'confirmed';
      new.answered_at := now();
    end if;
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
  using (family_id = public.my_family_id()) with check (family_id = public.my_family_id() and public.family_active());

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
  for insert with check (
    family_id = public.my_family_id() and created_by = auth.uid() and status = 'proposed' and public.family_active()
  );
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
  if not public.family_active() then
    raise exception 'subscription_required';
  end if;
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
  for insert with check (
    family_id = public.my_family_id() and created_by = auth.uid() and reply is null and public.family_active()
  );
-- Nachweise bleiben: kein Bearbeiten und kein Löschen.

create or replace function public.reply_handover(p_id uuid, p_confirm boolean, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.family_active() then
    raise exception 'subscription_required';
  end if;
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
create policy agreements_insert on public.agreements
  for insert with check (family_id = public.my_family_id() and public.family_active());
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
  if not public.family_active() then
    raise exception 'subscription_required';
  end if;
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

create or replace function public.storage_folder(p_path text)
returns text
language sql
immutable
as $$
  select split_part(p_path, '/', 1)
$$;

-- ───────────── Dokumente ─────────────
-- Zeugnisse, Arztbriefe, Bescheide … für beide sichtbar. Gesundheitsdokumente (Art. 9 DSGVO) nur mit
-- ausdrücklicher Einwilligung des Hochladenden (health_consent_at). Löschen darf, wer hochgeladen hat.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null default public.my_family_id() references public.families (id) on delete cascade,
  title text not null check (length(title) between 1 and 200),
  category text not null default 'sonstiges' check (category in ('gesundheit', 'schule', 'behoerde', 'sonstiges')),
  doc_date date,
  file_path text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes int not null default 0 check (size_bytes between 0 and 10485760),
  health_consent_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint documents_health_consent check (category <> 'gesundheit' or health_consent_at is not null)
);

alter table public.documents enable row level security;
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select using (family_id = public.my_family_id());
drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents
  for insert with check (
    family_id = public.my_family_id()
    and created_by = auth.uid()
    and public.storage_folder(file_path) = public.my_family_id()::text
    and public.family_active()
  );
drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents for delete using (created_by = auth.uid());
drop policy if exists documents_professional on public.documents;
create policy documents_professional on public.documents
  for select using (family_id in (select public.my_case_ids()));

-- Verfasser und Zeitpunkt (auch der Einwilligung) setzt der Server.
create or replace function public.documents_before_insert()
returns trigger
language plpgsql
as $$
begin
  new.created_by := auth.uid();
  new.created_at := now();
  if new.health_consent_at is not null then
    new.health_consent_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists documents_before_insert on public.documents;
create trigger documents_before_insert before insert on public.documents
  for each row execute function public.documents_before_insert();

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
  with check (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = public.my_family_id()::text and public.family_active()
  );
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

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
-- Höchstens 10 MB pro Datei, nur PDF und Bilder.
update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp']
 where id = 'documents';

drop policy if exists documents_files_select on storage.objects;
create policy documents_files_select on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = public.my_family_id()::text);
drop policy if exists documents_files_insert on storage.objects;
create policy documents_files_insert on storage.objects for insert
  with check (
    bucket_id = 'documents' and (storage.foldername(name))[1] = public.my_family_id()::text and public.family_active()
  );
drop policy if exists documents_files_delete on storage.objects;
create policy documents_files_delete on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.my_family_id()::text
    and (owner_id = auth.uid()::text or not public.other_parent_present())
  );
drop policy if exists documents_files_professional on storage.objects;
create policy documents_files_professional on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] in (select public.my_case_ids()::text));

drop policy if exists receipts_professional on storage.objects;
create policy receipts_professional on storage.objects for select
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] in (select public.my_case_ids()::text));

-- ───────────── Unterhalt: Soll und Ist ─────────────
-- Soll: was vereinbart oder festgelegt ist (Absprache, Jugendamtsurkunde, Beschluss) – ab einem Monat. Eine Änderung ist
-- ein neuer Eintrag, alte bleiben sichtbar. Die App rechnet keinen Unterhalt aus (keine Rechtsberatung).
-- Ist: Zahlungen je Monat. Trägt der Zahlende ein, bestätigt der Empfänger; trägt der Empfänger ein, gilt sie als erhalten.

create table if not exists public.maintenance_terms (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null default public.my_family_id() references public.families (id) on delete cascade,
  payer text not null check (payer in ('a', 'b')),
  amount_cents int not null check (amount_cents between 0 and 10000000),
  valid_from date not null check (extract(day from valid_from) = 1),
  basis text not null default '' check (length(basis) <= 300),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.maintenance_terms enable row level security;
drop policy if exists maintenance_terms_select on public.maintenance_terms;
create policy maintenance_terms_select on public.maintenance_terms for select using (family_id = public.my_family_id());
drop policy if exists maintenance_terms_insert on public.maintenance_terms;
create policy maintenance_terms_insert on public.maintenance_terms
  for insert with check (family_id = public.my_family_id() and created_by = auth.uid() and public.family_active());
-- Nachweis: kein Bearbeiten und kein Löschen – korrigiert wird mit einem neuen Eintrag.

create table if not exists public.maintenance_payments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null default public.my_family_id() references public.families (id) on delete cascade,
  payer text not null check (payer in ('a', 'b')),
  month date not null check (extract(day from month) = 1),
  amount_cents int not null check (amount_cents > 0 and amount_cents <= 10000000),
  paid_on date not null,
  note text not null default '' check (length(note) <= 500),
  status text not null default 'open' check (status in ('open', 'confirmed', 'disputed')),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create index if not exists maintenance_payments_family on public.maintenance_payments (family_id, month);

alter table public.maintenance_payments enable row level security;
drop policy if exists maintenance_payments_select on public.maintenance_payments;
create policy maintenance_payments_select on public.maintenance_payments
  for select using (family_id = public.my_family_id());
drop policy if exists maintenance_payments_insert on public.maintenance_payments;
create policy maintenance_payments_insert on public.maintenance_payments
  for insert with check (family_id = public.my_family_id() and created_by = auth.uid() and public.family_active());
-- Nur eigene, noch unbestätigte Einträge darf man zurücknehmen.
drop policy if exists maintenance_payments_delete on public.maintenance_payments;
create policy maintenance_payments_delete on public.maintenance_payments
  for delete using (created_by = auth.uid() and status = 'open');

create or replace function public.answer_maintenance(p_id uuid, p_confirm boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.family_active() then
    raise exception 'subscription_required';
  end if;
  update public.maintenance_payments
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

do $$
declare
  t text;
begin
  foreach t in array array['maintenance_terms', 'maintenance_payments'] loop
    execute format('drop trigger if exists force_insert_meta on public.%I', t);
    execute format(
      'create trigger force_insert_meta before insert on public.%I for each row execute function public.force_insert_meta()', t
    );
    execute format('drop policy if exists %I on public.%I', t || '_professional', t);
    execute format(
      'create policy %I on public.%I for select using (family_id in (select public.my_case_ids()))',
      t || '_professional', t
    );
  end loop;
end;
$$;

-- ───────────── Packliste für Übergaben ─────────────
-- „Immer mit“ (recurring) bleibt stehen, „nur nächstes Mal“ verschwindet nach der Übergabe. holder: wo es gerade liegt.

create table if not exists public.packing_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null default public.my_family_id() references public.families (id) on delete cascade,
  label text not null check (length(label) between 1 and 100),
  recurring boolean not null default false,
  packed boolean not null default false,
  holder text check (holder in ('a', 'b')),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.packing_items enable row level security;
drop policy if exists packing_items_family on public.packing_items;
create policy packing_items_family on public.packing_items for all
  using (family_id = public.my_family_id()) with check (family_id = public.my_family_id() and public.family_active());

drop trigger if exists packing_items_touch on public.packing_items;
create trigger packing_items_touch before insert or update on public.packing_items
  for each row execute function public.child_info_touch();

-- Nach der Übergabe: alles wieder auspacken, Einmal-Sachen, die mitgingen, entfernen.
create or replace function public.reset_packing()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.family_active() then
    raise exception 'subscription_required';
  end if;
  delete from public.packing_items where family_id = public.my_family_id() and packed and not recurring;
  update public.packing_items set packed = false where family_id = public.my_family_id() and packed;
end;
$$;

-- ───────────── Kalender-Abo (iPhone, Google, Outlook) ─────────────
-- Jeder Elternteil bekommt eine geheime Adresse. Die Edge Function „calendar“ liefert darüber den Umgangsplan als
-- iCalendar (ICS). Wer die Adresse kennt, sieht den Plan – deshalb jederzeit neu erzeugbar oder abschaltbar.

create table if not exists public.calendar_feeds (
  user_id uuid primary key references auth.users (id) on delete cascade,
  token text not null unique,
  lang text not null default 'de',
  created_at timestamptz not null default now()
);
-- Kein direkter Zugriff: nur über die Funktionen unten.
alter table public.calendar_feeds enable row level security;

create or replace function public.my_calendar_token(p_lang text, p_new boolean default false)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  if public.my_family_id() is null then
    raise exception 'not_allowed';
  end if;
  insert into public.calendar_feeds (user_id, token, lang)
  values (auth.uid(), v_token, coalesce(nullif(left(p_lang, 5), ''), 'de'))
  on conflict (user_id) do update
    set token = case when p_new then excluded.token else calendar_feeds.token end,
        lang = excluded.lang
  returning token into v_token;
  return v_token;
end;
$$;

create or replace function public.stop_calendar_feed()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.calendar_feeds where user_id = auth.uid()
$$;

-- Bei wem ist das Kind an welchem Tag? Gleiche Regeln wie src/lib/schedule.ts (Muster + bestätigte Ausnahmen).
create or replace function public.calendar_days(p_family uuid, p_from date, p_to date)
returns table (day date, parent text)
language sql
stable
security definer
set search_path = public
as $$
  with f as (
    select f.*,
           case f.schedule_model
             when 'wechsel_7_7' then 'FFFFFFFOOOOOOO'
             when 'wechsel_2_2_5_5' then 'FFOOFFFFFOOOOO'
             when 'wechsel_2_2_3' then 'FFOOFFFOOFFOOO'
             when 'residenz_we' then 'FFFFOOOFFFFFFF'
           end as pattern
      from public.families f
     where f.id = p_family
  ),
  ch as (
    select distinct on (c.day) c.day, c.parent
      from public.schedule_changes c
     where c.family_id = p_family and c.status = 'accepted' and c.day between p_from and p_to
     order by c.day, coalesce(c.answered_at, c.created_at) desc
  )
  select d::date,
         coalesce(
           ch.parent,
           case
             when f.pattern is null or d::date < f.schedule_start then null
             when substr(f.pattern, ((d::date - f.schedule_start) % 14) + 1, 1) = 'F' then f.schedule_first
             when f.schedule_first = 'a' then 'b'
             else 'a'
           end
         )
    from f
    cross join generate_series(p_from, p_to, interval '1 day') d
    left join ch on ch.day = d::date
   order by 1
$$;

create or replace function public.ics_text(p text)
returns text
language sql
immutable
as $$
  select replace(replace(replace(replace(replace(coalesce(p, ''), '\', '\\'), ';', '\;'), ',', '\,'), chr(13), ''), chr(10), '\n')
$$;

-- Der ganze Kalender als ICS-Text (Zeilen ohne Umbruch nach 75 Zeichen – das macht die Edge Function).
create or replace function public.calendar_ics(p_token text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_feed public.calendar_feeds;
  v_family public.families;
  v_kids text;
  v_lines text[] := array[
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Zwei Zuhause//Umgang//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Zwei Zuhause', 'REFRESH-INTERVAL;VALUE=DURATION:PT6H', 'X-PUBLISHED-TTL:PT6H'
  ];
  v_stamp text := to_char(now() at time zone 'utc', 'YYYYMMDD"T"HH24MISS"Z"');
  v_from date := current_date - 60;
  v_run_start date;
  v_run_parent text;
  v_prev text;
  r record;
begin
  select * into v_feed from public.calendar_feeds where token = p_token;
  if not found then
    return null;
  end if;
  select * into v_family from public.families where parent_a = v_feed.user_id or parent_b = v_feed.user_id limit 1;
  if not found then
    return null;
  end if;
  v_kids := coalesce(nullif(trim(v_family.children), ''), public.push_text(v_feed.lang, 'calChild', '{}'));

  -- Ein Eintrag je zusammenhängendem Zeitraum („Mia bei Anna“), dazu die Übergaben mit Uhrzeit und Ort.
  -- Der Tag nach dem Zeitraum (null) schließt den letzten Zeitraum ab.
  for r in
    select d.day, d.parent from public.calendar_days(v_family.id, v_from, current_date + 365) d
    union all select current_date + 366, null
    order by 1
  loop
    if r.parent is distinct from v_run_parent then
      if v_run_parent is not null then
        v_lines := v_lines || array[
          'BEGIN:VEVENT',
          'UID:' || v_family.id || '-' || to_char(v_run_start, 'YYYYMMDD') || '@zweizuhause',
          'DTSTAMP:' || v_stamp,
          'DTSTART;VALUE=DATE:' || to_char(v_run_start, 'YYYYMMDD'),
          'DTEND;VALUE=DATE:' || to_char(r.day, 'YYYYMMDD'),
          'SUMMARY:' || public.ics_text(public.push_text(v_feed.lang, 'calStay', jsonb_build_object(
            'children', v_kids,
            'name', case v_run_parent when 'a' then v_family.name_a else v_family.name_b end))),
          'TRANSP:TRANSPARENT',
          'END:VEVENT'
        ];
      end if;
      -- Übergabe: nur mit festgelegter Uhrzeit, sonst zeigt der Zeitraum den Wechsel schon.
      if v_prev is not null and r.parent is not null and v_family.handover_time <> '' then
        v_lines := v_lines || array[
          'BEGIN:VEVENT',
          'UID:' || v_family.id || '-h' || to_char(r.day, 'YYYYMMDD') || '@zweizuhause',
          'DTSTAMP:' || v_stamp,
          'DTSTART:' || to_char(r.day, 'YYYYMMDD') || 'T' || replace(v_family.handover_time, ':', '') || '00',
          'DURATION:PT30M',
          'SUMMARY:' || public.ics_text(public.push_text(v_feed.lang, 'calHandover', jsonb_build_object(
            'children', v_kids,
            'name', case r.parent when 'a' then v_family.name_a else v_family.name_b end)))
        ] || case when v_family.handover_place <> ''
                  then array['LOCATION:' || public.ics_text(v_family.handover_place)] else array[]::text[] end
          || array['END:VEVENT'];
      end if;
      v_run_start := r.day;
      v_run_parent := r.parent;
    end if;
    if r.parent is not null then
      v_prev := r.parent;
    end if;
  end loop;

  return array_to_string(v_lines || array['END:VCALENDAR'], chr(13) || chr(10)) || chr(13) || chr(10);
end;
$$;

revoke execute on function public.calendar_ics(text) from public, anon, authenticated;
revoke execute on function public.calendar_days(uuid, date, date) from public, anon, authenticated;

-- ───────────── Live-Updates ─────────────

do $$
declare
  t text;
begin
  foreach t in array array['families', 'schedule_changes', 'expenses', 'messages', 'child_info', 'decisions', 'handovers', 'agreements', 'professional_access', 'documents',
                           'maintenance_terms', 'maintenance_payments', 'packing_items'] loop
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
    'join_as_professional(text)', 'my_invite_code()', 'set_read_receipts(boolean)',
    'answer_maintenance(uuid, boolean)', 'reset_packing()', 'my_calendar_token(text, boolean)', 'stop_calendar_feed()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

-- ───────────── Push-Mitteilungen ─────────────
-- Jedes Handy meldet sein Expo-Push-Token und seine App-Sprache. Neue Nachrichten, Anfragen und Antworten schicken über
-- pg_net eine Mitteilung an den anderen Elternteil (Expo Push Service, exp.host) – in dessen Sprache. Bewusst ohne
-- Inhalt: Mitteilungen stehen auf dem Sperrbildschirm und laufen über Expo und Apple/Google.

create extension if not exists pg_net with schema extensions;

create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now()
);
alter table public.push_tokens add column if not exists lang text not null default 'de';
create index if not exists push_tokens_user on public.push_tokens (user_id);
-- Kein direkter Zugriff: nur über die beiden Funktionen unten.
alter table public.push_tokens enable row level security;

drop function if exists public.register_push_token(text);
create or replace function public.register_push_token(p_token text, p_lang text default 'de')
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
  insert into public.push_tokens (token, user_id, lang, updated_at)
  values (p_token, auth.uid(), coalesce(nullif(left(p_lang, 5), ''), 'de'), now())
  on conflict (token) do update set user_id = excluded.user_id, lang = excluded.lang, updated_at = now();
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

revoke execute on function public.register_push_token(text, text) from public, anon;
revoke execute on function public.unregister_push_token(text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;

-- Übersetzte Mitteilungstexte (Inhalt am Ende dieser Datei, erzeugt aus der App: scripts/push-texts.ts).
create table if not exists public.push_texts (
  lang text not null,
  key text not null,
  text text not null,
  primary key (lang, key)
);
alter table public.push_texts enable row level security;

-- Text in der gewünschten Sprache (sonst Deutsch) mit eingesetzten Platzhaltern {name}, {label}, {title}.
create or replace function public.push_text(p_lang text, p_key text, p_vars jsonb)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_text text;
  v_var record;
begin
  select coalesce(
           (select text from public.push_texts where lang = p_lang and key = p_key),
           (select text from public.push_texts where lang = 'de' and key = p_key),
           ''
         )
    into v_text;
  for v_var in select * from jsonb_each_text(coalesce(p_vars, '{}'::jsonb)) loop
    v_text := replace(v_text, '{' || v_var.key || '}', coalesce(v_var.value, ''));
  end loop;
  return v_text;
end;
$$;

-- Schickt eine Mitteilung an alle Handys des anderen Elternteils (aus Sicht von p_sender), je Handy in dessen Sprache.
drop function if exists public.notify_other(uuid, uuid, text, text, text);
create or replace function public.notify_other(
  p_family uuid, p_sender uuid, p_title_key text, p_body_key text, p_vars jsonb, p_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_other uuid;
  v_name text;
  v_messages jsonb;
begin
  select case when parent_a = p_sender then parent_b else parent_a end,
         case when parent_a = p_sender then name_a else name_b end
    into v_other, v_name
    from public.families
   where id = p_family;
  if v_other is null or p_sender is null then
    return;
  end if;
  select jsonb_agg(jsonb_build_object(
           'to', t.token,
           'title', public.push_text(t.lang, p_title_key,
                      p_vars || jsonb_build_object('name',
                        coalesce(nullif(trim(v_name), ''), public.push_text(t.lang, 'otherParent', '{}'::jsonb)))),
           'body', public.push_text(t.lang, p_body_key, p_vars),
           'sound', 'default',
           'data', jsonb_build_object('url', p_url)))
    into v_messages
    from public.push_tokens t
   where t.user_id = v_other;
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

revoke execute on function public.notify_other(uuid, uuid, text, text, jsonb, text) from public, anon, authenticated;

create or replace function public.push_on_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_body text := 'tapToOpen';
  v_vars jsonb := '{}'::jsonb;
  v_url text := '/';
begin
  if tg_table_name = 'messages' then
    v_title := 'messageTitle';
    v_body := 'messageBody';
    v_url := '/messages';
  elsif tg_table_name = 'schedule_changes' then
    v_url := '/calendar';
    v_title := case when tg_op = 'INSERT' then 'changeNew' when new.status = 'accepted' then 'changeAccepted' else 'changeDeclined' end;
  elsif tg_table_name = 'expenses' then
    v_url := '/expenses';
    if tg_op = 'INSERT' then
      v_title := 'expenseNew';
      v_body := 'expenseNewBody';
    else
      v_title := case when new.status = 'confirmed' then 'expenseConfirmed' else 'expenseDisputed' end;
    end if;
  elsif tg_table_name = 'decisions' then
    v_url := '/decisions';
    v_title := case when tg_op = 'INSERT' then 'decisionNew' when new.status = 'agreed' then 'decisionAgreed' else 'decisionRejected' end;
  elsif tg_table_name = 'handovers' then
    v_url := '/handovers';
    v_title := case when tg_op = 'INSERT' then 'handoverNew' else 'handoverReply' end;
  elsif tg_table_name = 'agreements' then
    v_url := '/agreement';
    if tg_op = 'INSERT' then
      v_title := 'agreementNew';
      v_body := 'agreementNewBody';
    else
      v_title := 'agreementAccepted';
    end if;
  elsif tg_table_name = 'professional_access' then
    v_url := '/professionals';
    v_title := 'professionalInvite';
    v_body := 'professionalInviteBody';
    v_vars := jsonb_build_object('label', new.label);
  elsif tg_table_name = 'maintenance_payments' then
    v_url := '/maintenance';
    if tg_op = 'INSERT' then
      v_title := 'maintenanceNew';
      v_body := 'maintenanceNewBody';
    else
      v_title := case when new.status = 'confirmed' then 'maintenanceConfirmed' else 'maintenanceDisputed' end;
    end if;
  elsif tg_table_name = 'documents' then
    v_url := '/documents';
    v_title := 'documentNew';
    v_body := 'documentNewBody';
    v_vars := jsonb_build_object('title', new.title);
  else
    return null;
  end if;

  perform public.notify_other(new.family_id, auth.uid(), v_title, v_body, v_vars, v_url);
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['messages', 'schedule_changes', 'expenses', 'decisions', 'handovers', 'agreements', 'professional_access', 'documents', 'maintenance_payments'] loop
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
drop trigger if exists push_on_answer on public.maintenance_payments;
create trigger push_on_answer after update of status on public.maintenance_payments
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

-- ───────────── Übersetzte Mitteilungstexte ─────────────
-- PUSH_TEXTS_BEGIN (erzeugt mit: npx tsx scripts/push-texts.ts – nicht von Hand ändern)
insert into public.push_texts (lang, key, text) values
  ('de', 'tapToOpen', 'Tipp hier, um es anzusehen.'),
  ('de', 'messageTitle', '💬 Neue Nachricht von {name}'),
  ('de', 'messageBody', 'Tipp hier, um sie zu lesen.'),
  ('de', 'changeNew', '📅 {name} schlägt eine Änderung im Umgang vor'),
  ('de', 'changeAccepted', '✅ {name} hat deinem Vorschlag zugestimmt'),
  ('de', 'changeDeclined', '❌ {name} hat deinen Vorschlag abgelehnt'),
  ('de', 'expenseNew', '💶 {name} hat eine Ausgabe eingetragen'),
  ('de', 'expenseNewBody', 'Bitte prüfen und bestätigen.'),
  ('de', 'expenseConfirmed', '✅ {name} hat eine Ausgabe bestätigt'),
  ('de', 'expenseDisputed', '❌ {name} hat eine Ausgabe abgelehnt'),
  ('de', 'decisionNew', '🤝 {name} bittet um eine Entscheidung'),
  ('de', 'decisionAgreed', '✅ {name} hat zugestimmt'),
  ('de', 'decisionRejected', '❌ {name} hat nicht zugestimmt'),
  ('de', 'handoverNew', '🚗 {name} hat eine Übergabe eingetragen'),
  ('de', 'handoverReply', '🚗 {name} hat auf deinen Übergabe-Eintrag geantwortet'),
  ('de', 'agreementNew', '📝 {name} hat die Elternvereinbarung bearbeitet'),
  ('de', 'agreementNewBody', 'Lies die neue Fassung und stimme zu, wenn sie für dich passt.'),
  ('de', 'agreementAccepted', '📝 {name} hat der Elternvereinbarung zugestimmt'),
  ('de', 'professionalInvite', '🔐 {name} möchte eine Fachkraft einladen'),
  ('de', 'professionalInviteBody', '{label} – bitte zustimmen oder ablehnen.'),
  ('de', 'documentNew', '📄 {name} hat ein Dokument geteilt'),
  ('de', 'documentNewBody', '{title}'),
  ('de', 'maintenanceNew', '💶 {name} hat eine Unterhaltszahlung eingetragen'),
  ('de', 'maintenanceNewBody', 'Tipp hier, um sie anzusehen.'),
  ('de', 'maintenanceConfirmed', '✅ {name} hat den Erhalt bestätigt'),
  ('de', 'maintenanceDisputed', '❌ {name} hat den Erhalt nicht bestätigt'),
  ('de', 'calStay', '{children} bei {name}'),
  ('de', 'calHandover', 'Übergabe: {children} zu {name}'),
  ('de', 'calChild', 'Kind'),
  ('de', 'otherParent', 'Der andere Elternteil'),
  ('en', 'tapToOpen', 'Tap here to view it.'),
  ('en', 'messageTitle', '💬 New message from {name}'),
  ('en', 'messageBody', 'Tap here to read it.'),
  ('en', 'changeNew', '📅 {name} is proposing a change to the contact schedule'),
  ('en', 'changeAccepted', '✅ {name} accepted your proposal'),
  ('en', 'changeDeclined', '❌ {name} declined your proposal'),
  ('en', 'expenseNew', '💶 {name} added an expense'),
  ('en', 'expenseNewBody', 'Please review and confirm.'),
  ('en', 'expenseConfirmed', '✅ {name} confirmed an expense'),
  ('en', 'expenseDisputed', '❌ {name} rejected an expense'),
  ('en', 'decisionNew', '🤝 {name} is asking for a decision'),
  ('en', 'decisionAgreed', '✅ {name} agreed'),
  ('en', 'decisionRejected', '❌ {name} did not agree'),
  ('en', 'handoverNew', '🚗 {name} recorded a handover'),
  ('en', 'handoverReply', '🚗 {name} replied to your handover entry'),
  ('en', 'agreementNew', '📝 {name} edited the parenting agreement'),
  ('en', 'agreementNewBody', 'Read the new version and agree if it works for you.'),
  ('en', 'agreementAccepted', '📝 {name} agreed to the parenting agreement'),
  ('en', 'professionalInvite', '🔐 {name} would like to invite a professional'),
  ('en', 'professionalInviteBody', '{label} – please approve or decline.'),
  ('en', 'documentNew', '📄 {name} shared a document'),
  ('en', 'documentNewBody', '{title}'),
  ('en', 'otherParent', 'The other parent'),
  ('tr', 'tapToOpen', 'Görüntülemek için dokunun.'),
  ('tr', 'messageTitle', '💬 {name} size yeni bir mesaj gönderdi'),
  ('tr', 'messageBody', 'Okumak için dokunun.'),
  ('tr', 'changeNew', '📅 {name} bakım planında bir değişiklik öneriyor'),
  ('tr', 'changeAccepted', '✅ {name} önerinizi kabul etti'),
  ('tr', 'changeDeclined', '❌ {name} önerinizi reddetti'),
  ('tr', 'expenseNew', '💶 {name} bir harcama girdi'),
  ('tr', 'expenseNewBody', 'Lütfen kontrol edip onaylayın.'),
  ('tr', 'expenseConfirmed', '✅ {name} bir harcamayı onayladı'),
  ('tr', 'expenseDisputed', '❌ {name} bir harcamayı reddetti'),
  ('tr', 'decisionNew', '🤝 {name} bir karar için yanıtınızı bekliyor'),
  ('tr', 'decisionAgreed', '✅ {name} onayladı'),
  ('tr', 'decisionRejected', '❌ {name} onaylamadı'),
  ('tr', 'handoverNew', '🚗 {name} bir teslim kaydı girdi'),
  ('tr', 'handoverReply', '🚗 {name} teslim kaydınıza yanıt verdi'),
  ('tr', 'agreementNew', '📝 {name} ebeveyn anlaşmasını düzenledi'),
  ('tr', 'agreementNewBody', 'Yeni metni okuyun ve sizin için uygunsa onaylayın.'),
  ('tr', 'agreementAccepted', '📝 {name} ebeveyn anlaşmasını onayladı'),
  ('tr', 'professionalInvite', '🔐 {name} bir uzmanı davet etmek istiyor'),
  ('tr', 'professionalInviteBody', '{label} – lütfen onaylayın veya reddedin.'),
  ('tr', 'documentNew', '📄 {name} bir belge paylaştı'),
  ('tr', 'documentNewBody', '{title}'),
  ('tr', 'otherParent', 'Diğer ebeveyn'),
  ('ar', 'tapToOpen', 'للعرض، يُرجى الضغط هنا.'),
  ('ar', 'messageTitle', '💬 رسالة جديدة من {name}'),
  ('ar', 'messageBody', 'للقراءة، يُرجى الضغط هنا.'),
  ('ar', 'changeNew', '📅 اقتراح تغيير في جدول الرعاية من {name}'),
  ('ar', 'changeAccepted', '✅ {name}: تمت الموافقة على اقتراحك'),
  ('ar', 'changeDeclined', '❌ {name}: تم رفض اقتراحك'),
  ('ar', 'expenseNew', '💶 {name}: تم تسجيل مصروف'),
  ('ar', 'expenseNewBody', 'يُرجى المراجعة والتأكيد.'),
  ('ar', 'expenseConfirmed', '✅ {name}: تم تأكيد مصروف'),
  ('ar', 'expenseDisputed', '❌ {name}: تم رفض مصروف'),
  ('ar', 'decisionNew', '🤝 طلب قرار من {name}'),
  ('ar', 'decisionAgreed', '✅ {name}: تمت الموافقة'),
  ('ar', 'decisionRejected', '❌ {name}: لم تتم الموافقة'),
  ('ar', 'handoverNew', '🚗 {name}: تم تسجيل تسليم'),
  ('ar', 'handoverReply', '🚗 {name}: رد على تسجيل التسليم الخاص بك'),
  ('ar', 'agreementNew', '📝 {name}: تم تعديل اتفاق الوالدين'),
  ('ar', 'agreementNewBody', 'يُرجى قراءة النسخة الجديدة والموافقة عليها إن كانت مناسبة لك.'),
  ('ar', 'agreementAccepted', '📝 {name}: تمت الموافقة على اتفاق الوالدين'),
  ('ar', 'professionalInvite', '🔐 {name}: طلب دعوة مختص'),
  ('ar', 'professionalInviteBody', '{label} – يُرجى الموافقة أو الرفض.'),
  ('ar', 'documentNew', '📄 {name}: تمت مشاركة مستند'),
  ('ar', 'documentNewBody', '{title}'),
  ('ar', 'otherParent', 'الطرف الآخر من الوالدين'),
  ('ru', 'tapToOpen', 'Нажмите, чтобы посмотреть.'),
  ('ru', 'messageTitle', '💬 Новое сообщение от: {name}'),
  ('ru', 'messageBody', 'Нажмите, чтобы прочитать.'),
  ('ru', 'changeNew', '📅 {name} предлагает изменение в графике общения'),
  ('ru', 'changeAccepted', '✅ {name} принимает ваше предложение'),
  ('ru', 'changeDeclined', '❌ {name} отклоняет ваше предложение'),
  ('ru', 'expenseNew', '💶 {name} добавляет расход'),
  ('ru', 'expenseNewBody', 'Пожалуйста, проверьте и подтвердите.'),
  ('ru', 'expenseConfirmed', '✅ {name} подтверждает расход'),
  ('ru', 'expenseDisputed', '❌ {name} отклоняет расход'),
  ('ru', 'decisionNew', '🤝 {name} просит принять решение'),
  ('ru', 'decisionAgreed', '✅ {name} соглашается'),
  ('ru', 'decisionRejected', '❌ {name} не соглашается'),
  ('ru', 'handoverNew', '🚗 {name} добавляет запись о передаче'),
  ('ru', 'handoverReply', '🚗 {name} отвечает на вашу запись о передаче'),
  ('ru', 'agreementNew', '📝 {name} изменяет родительскую договорённость'),
  ('ru', 'agreementNewBody', 'Прочитайте новую редакцию и дайте согласие, если она вам подходит.'),
  ('ru', 'agreementAccepted', '📝 {name} соглашается с родительской договорённостью'),
  ('ru', 'professionalInvite', '🔐 {name} хочет пригласить специалиста'),
  ('ru', 'professionalInviteBody', '{label} – пожалуйста, согласитесь или отклоните.'),
  ('ru', 'documentNew', '📄 {name} делится документом'),
  ('ru', 'documentNewBody', '{title}'),
  ('ru', 'otherParent', 'Другой родитель'),
  ('uk', 'tapToOpen', 'Натисніть, щоб переглянути.'),
  ('uk', 'messageTitle', '💬 Нове повідомлення від {name}'),
  ('uk', 'messageBody', 'Натисніть, щоб прочитати.'),
  ('uk', 'changeNew', '📅 {name}: пропозиція змінити графік спілкування з дитиною'),
  ('uk', 'changeAccepted', '✅ {name}: вашу пропозицію прийнято'),
  ('uk', 'changeDeclined', '❌ {name}: вашу пропозицію відхилено'),
  ('uk', 'expenseNew', '💶 {name}: внесено нову витрату'),
  ('uk', 'expenseNewBody', 'Будь ласка, перевірте й підтвердьте.'),
  ('uk', 'expenseConfirmed', '✅ {name}: витрату підтверджено'),
  ('uk', 'expenseDisputed', '❌ {name}: витрату відхилено'),
  ('uk', 'decisionNew', '🤝 {name} просить ухвалити рішення'),
  ('uk', 'decisionAgreed', '✅ {name}: згоду надано'),
  ('uk', 'decisionRejected', '❌ {name}: згоди не надано'),
  ('uk', 'handoverNew', '🚗 {name}: внесено передачу дитини'),
  ('uk', 'handoverReply', '🚗 {name}: відповідь на ваш запис про передачу'),
  ('uk', 'agreementNew', '📝 {name}: батьківську угоду змінено'),
  ('uk', 'agreementNewBody', 'Прочитайте нову редакцію і погодьтеся, якщо вона вам підходить.'),
  ('uk', 'agreementAccepted', '📝 {name}: згоду з батьківською угодою надано'),
  ('uk', 'professionalInvite', '🔐 {name} хоче запросити фахівця'),
  ('uk', 'professionalInviteBody', '{label} – будь ласка, погодьтеся або відхиліть.'),
  ('uk', 'documentNew', '📄 {name}: новий спільний документ'),
  ('uk', 'documentNewBody', '{title}'),
  ('uk', 'otherParent', 'Інший із батьків'),
  ('pl', 'tapToOpen', 'Dotknij, aby zobaczyć.'),
  ('pl', 'messageTitle', '💬 Nowa wiadomość od: {name}'),
  ('pl', 'messageBody', 'Dotknij, aby przeczytać.'),
  ('pl', 'changeNew', '📅 {name} proponuje zmianę w planie opieki'),
  ('pl', 'changeAccepted', '✅ {name} przyjmuje twoją propozycję'),
  ('pl', 'changeDeclined', '❌ {name} odrzuca twoją propozycję'),
  ('pl', 'expenseNew', '💶 {name} dodaje wydatek'),
  ('pl', 'expenseNewBody', 'Sprawdź i potwierdź.'),
  ('pl', 'expenseConfirmed', '✅ {name} potwierdza wydatek'),
  ('pl', 'expenseDisputed', '❌ {name} odrzuca wydatek'),
  ('pl', 'decisionNew', '🤝 {name} prosi o decyzję'),
  ('pl', 'decisionAgreed', '✅ {name} wyraża zgodę'),
  ('pl', 'decisionRejected', '❌ {name} nie wyraża zgody'),
  ('pl', 'handoverNew', '🚗 {name} dodaje wpis o przekazaniu'),
  ('pl', 'handoverReply', '🚗 {name} odpowiada na twój wpis o przekazaniu'),
  ('pl', 'agreementNew', '📝 {name} zmienia porozumienie rodzicielskie'),
  ('pl', 'agreementNewBody', 'Przeczytaj nową wersję i zaakceptuj ją, jeśli ci odpowiada.'),
  ('pl', 'agreementAccepted', '📝 {name} akceptuje porozumienie rodzicielskie'),
  ('pl', 'professionalInvite', '🔐 {name} chce zaprosić specjalistę'),
  ('pl', 'professionalInviteBody', '{label} – zaakceptuj lub odrzuć.'),
  ('pl', 'documentNew', '📄 {name} udostępnia dokument'),
  ('pl', 'documentNewBody', '{title}'),
  ('pl', 'otherParent', 'Drugi rodzic'),
  ('sq', 'tapToOpen', 'Prek këtu për ta parë.'),
  ('sq', 'messageTitle', '💬 Mesazh i ri nga {name}'),
  ('sq', 'messageBody', 'Prek këtu për ta lexuar.'),
  ('sq', 'changeNew', '📅 {name} propozon një ndryshim në planin e kujdesit'),
  ('sq', 'changeAccepted', '✅ {name} e pranoi propozimin tënd'),
  ('sq', 'changeDeclined', '❌ {name} e refuzoi propozimin tënd'),
  ('sq', 'expenseNew', '💶 {name} shënoi një shpenzim'),
  ('sq', 'expenseNewBody', 'Kontrolloje dhe konfirmoje.'),
  ('sq', 'expenseConfirmed', '✅ {name} konfirmoi një shpenzim'),
  ('sq', 'expenseDisputed', '❌ {name} refuzoi një shpenzim'),
  ('sq', 'decisionNew', '🤝 {name} kërkon një vendim'),
  ('sq', 'decisionAgreed', '✅ {name} ra dakord'),
  ('sq', 'decisionRejected', '❌ {name} nuk ra dakord'),
  ('sq', 'handoverNew', '🚗 {name} shënoi një dorëzim'),
  ('sq', 'handoverReply', '🚗 {name} iu përgjigj shënimit tënd për dorëzimin'),
  ('sq', 'agreementNew', '📝 {name} ndryshoi marrëveshjen prindërore'),
  ('sq', 'agreementNewBody', 'Lexo versionin e ri dhe prano nëse të përshtatet.'),
  ('sq', 'agreementAccepted', '📝 {name} pranoi marrëveshjen prindërore'),
  ('sq', 'professionalInvite', '🔐 {name} dëshiron të ftojë një profesionist'),
  ('sq', 'professionalInviteBody', '{label} – prano ose refuzo.'),
  ('sq', 'documentNew', '📄 {name} ndau një dokument'),
  ('sq', 'documentNewBody', '{title}'),
  ('sq', 'otherParent', 'Prindi tjetër'),
  ('ro', 'tapToOpen', 'Atinge aici pentru a vedea.'),
  ('ro', 'messageTitle', '💬 Mesaj nou de la {name}'),
  ('ro', 'messageBody', 'Atinge aici pentru a-l citi.'),
  ('ro', 'changeNew', '📅 {name} propune o modificare a programului'),
  ('ro', 'changeAccepted', '✅ {name} a acceptat propunerea ta'),
  ('ro', 'changeDeclined', '❌ {name} a respins propunerea ta'),
  ('ro', 'expenseNew', '💶 {name} a adăugat o cheltuială'),
  ('ro', 'expenseNewBody', 'Te rugăm să verifici și să confirmi.'),
  ('ro', 'expenseConfirmed', '✅ {name} a confirmat o cheltuială'),
  ('ro', 'expenseDisputed', '❌ {name} a respins o cheltuială'),
  ('ro', 'decisionNew', '🤝 {name} cere o decizie'),
  ('ro', 'decisionAgreed', '✅ {name} a fost de acord'),
  ('ro', 'decisionRejected', '❌ {name} nu a fost de acord'),
  ('ro', 'handoverNew', '🚗 {name} a înregistrat o predare'),
  ('ro', 'handoverReply', '🚗 {name} a răspuns la înregistrarea ta despre predare'),
  ('ro', 'agreementNew', '📝 {name} a modificat acordul parental'),
  ('ro', 'agreementNewBody', 'Citește noua versiune și acceptă-o dacă ți se potrivește.'),
  ('ro', 'agreementAccepted', '📝 {name} a acceptat acordul parental'),
  ('ro', 'professionalInvite', '🔐 {name} vrea să invite un specialist'),
  ('ro', 'professionalInviteBody', '{label} – te rugăm să accepți sau să refuzi.'),
  ('ro', 'documentNew', '📄 {name} a partajat un document'),
  ('ro', 'documentNewBody', '{title}'),
  ('ro', 'otherParent', 'Celălalt părinte'),
  ('sr', 'tapToOpen', 'Dodirnite ovde da biste pogledali.'),
  ('sr', 'messageTitle', '💬 Nova poruka – {name}'),
  ('sr', 'messageBody', 'Dodirnite ovde da biste je pročitali.'),
  ('sr', 'changeNew', '📅 {name} predlaže izmenu plana viđanja'),
  ('sr', 'changeAccepted', '✅ {name} je prihvatio/la vaš predlog'),
  ('sr', 'changeDeclined', '❌ {name} je odbio/la vaš predlog'),
  ('sr', 'expenseNew', '💶 {name} je uneo/la trošak'),
  ('sr', 'expenseNewBody', 'Proverite i potvrdite.'),
  ('sr', 'expenseConfirmed', '✅ {name} je potvrdio/la trošak'),
  ('sr', 'expenseDisputed', '❌ {name} je odbio/la trošak'),
  ('sr', 'decisionNew', '🤝 {name} traži odluku'),
  ('sr', 'decisionAgreed', '✅ {name} se saglasio/la'),
  ('sr', 'decisionRejected', '❌ {name} se nije saglasio/la'),
  ('sr', 'handoverNew', '🚗 {name} je uneo/la primopredaju'),
  ('sr', 'handoverReply', '🚗 {name} je odgovorio/la na vaš unos o primopredaji'),
  ('sr', 'agreementNew', '📝 {name} je izmenio/la roditeljski sporazum'),
  ('sr', 'agreementNewBody', 'Pročitajte novu verziju i saglasite se ako vam odgovara.'),
  ('sr', 'agreementAccepted', '📝 {name} se saglasio/la sa roditeljskim sporazumom'),
  ('sr', 'professionalInvite', '🔐 {name} želi da pozove stručno lice'),
  ('sr', 'professionalInviteBody', '{label} – saglasite se ili odbijte.'),
  ('sr', 'documentNew', '📄 {name} je podelio/la dokument'),
  ('sr', 'documentNewBody', '{title}'),
  ('sr', 'otherParent', 'Drugi roditelj'),
  ('fr', 'tapToOpen', 'Touchez ici pour l’afficher.'),
  ('fr', 'messageTitle', '💬 Nouveau message de {name}'),
  ('fr', 'messageBody', 'Touchez ici pour le lire.'),
  ('fr', 'changeNew', '📅 {name} propose une modification de la garde'),
  ('fr', 'changeAccepted', '✅ {name} a accepté votre proposition'),
  ('fr', 'changeDeclined', '❌ {name} a refusé votre proposition'),
  ('fr', 'expenseNew', '💶 {name} a saisi une dépense'),
  ('fr', 'expenseNewBody', 'Veuillez vérifier et confirmer.'),
  ('fr', 'expenseConfirmed', '✅ {name} a confirmé une dépense'),
  ('fr', 'expenseDisputed', '❌ {name} a refusé une dépense'),
  ('fr', 'decisionNew', '🤝 {name} demande une décision'),
  ('fr', 'decisionAgreed', '✅ {name} a donné son accord'),
  ('fr', 'decisionRejected', '❌ {name} n’a pas donné son accord'),
  ('fr', 'handoverNew', '🚗 {name} a saisi une remise de l’enfant'),
  ('fr', 'handoverReply', '🚗 {name} a répondu à votre saisie de remise'),
  ('fr', 'agreementNew', '📝 {name} a modifié l’accord parental'),
  ('fr', 'agreementNewBody', 'Lisez la nouvelle version et acceptez-la si elle vous convient.'),
  ('fr', 'agreementAccepted', '📝 {name} a accepté l’accord parental'),
  ('fr', 'professionalInvite', '🔐 {name} souhaite inviter un(e) professionnel(le)'),
  ('fr', 'professionalInviteBody', '{label} – veuillez accepter ou refuser.'),
  ('fr', 'documentNew', '📄 {name} a partagé un document'),
  ('fr', 'documentNewBody', '{title}'),
  ('fr', 'otherParent', 'L’autre parent')
on conflict (lang, key) do update set text = excluded.text;
-- PUSH_TEXTS_END
