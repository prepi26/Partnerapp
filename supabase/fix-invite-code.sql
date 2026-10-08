-- Einladungscodes nur noch aus Buchstaben (keine Ziffern).
-- Im Supabase SQL Editor einmal ausführen. Bestehende, noch nicht verbundene Paare bekommen einen neuen Code.

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

-- Neue Codes für alle Paare, bei denen der Partner noch nicht verbunden ist.
update public.couples c
   set invite_code = (
     select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ', (floor(random() * 24) + 1)::int, 1), '')
     from generate_series(1, 6)
     where c.id is not null
   )
 where partner_b is null
   and invite_code ~ '[0-9]';

select name_a, name_b, invite_code from public.couples where partner_b is null;
