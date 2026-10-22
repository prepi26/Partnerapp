-- Mehrere Familien pro Konto: Sandra hat Mia mit Thomas, Leo mit Markus und Emma mit Ali (Ali hat die Familie angelegt).
-- Kernfrage: Sieht oder ändert ein Vater irgendetwas aus einer anderen Familie? Erwartet: nein.
--   ./test-run.sh test-multi.sql → erwartet 6 ERROR-Zeilen
insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000005a0'), ('00000000-0000-0000-0000-0000000007a0'),
  ('00000000-0000-0000-0000-0000000008a0'), ('00000000-0000-0000-0000-0000000009a0'),
  ('00000000-0000-0000-0000-00000000f0a0');
create or replace function public.as_user(u text) returns void language sql as $$ select set_config('request.jwt.claim.sub', u, false) $$;
grant execute on function public.as_user(text) to authenticated;
set role authenticated;
\set sandra '00000000-0000-0000-0000-0000000005a0'
\set thomas '00000000-0000-0000-0000-0000000007a0'
\set markus '00000000-0000-0000-0000-0000000008a0'
\set ali '00000000-0000-0000-0000-0000000009a0'
\set pro '00000000-0000-0000-0000-00000000f0a0'

select as_user(:'sandra');
select create_family('Sandra', 'Thomas', 'Mia') as f1 \gset
select create_family('Sandra', 'Markus', 'Leo') as f2 \gset
select my_invite_code(:'f1') as c1 \gset
select my_invite_code(:'f2') as c2 \gset
select as_user(:'thomas');
select join_family(:'c1') = :'f1' as thomas_joined;
select as_user(:'markus');
select join_family(:'c2') = :'f2' as markus_joined;
select as_user(:'ali');
select create_family('Ali', 'Sandra', 'Emma') as f3 \gset
select my_invite_code(:'f3') as c3 \gset
select as_user(:'sandra');
select join_family(:'c3') = :'f3' as sandra_joined_as_b;
select parent_key(:'f1') as key_f1, parent_key(:'f3') as key_f3;

-- Einträge in jeder Familie
insert into messages (family_id, text) values (:'f1', 'an Thomas'), (:'f2', 'an Markus'), (:'f3', 'an Ali');
insert into expenses (family_id, title, amount_cents, day, paid_by) values (:'f1', 'Mia Schuhe', 5000, '2026-10-10', 'a');
insert into expenses (family_id, title, amount_cents, day, paid_by) values (:'f2', 'Leo Kita', 20000, '2026-10-10', 'a');
insert into journal (family_id, day, text) values (:'f1', '2026-10-10', 'Notiz zu Thomas'), (:'f2', '2026-10-10', 'Notiz zu Markus');
select f.name_b, m.sender_key from messages m join families f on f.id = m.family_id where f.id in (:'f1', :'f3') order by m.seq;

-- Thomas sieht nur Familie 1
select as_user(:'thomas');
select count(*) as thomas_families from families;
select count(*) as thomas_messages, min(text) as only_text from messages;
select count(*) as thomas_expenses from expenses;
select count(*) as thomas_journal from journal;
select count(*) as thomas_overview from my_families_overview();
-- ERROR 1: Thomas schreibt in Familie 2
insert into messages (family_id, text) values (:'f2', 'Thomas in fremder Familie');
-- ERROR 2: Thomas bestätigt eine Ausgabe aus Familie 2
reset role;
select id as e2 from expenses where family_id = :'f2' \gset
set role authenticated;
select as_user(:'thomas');
select answer_expense(:'e2', true);
-- Thomas liest den Einladungscode von Familie 2 – liefert nichts
select my_invite_code(:'f2') is null as no_foreign_code;
-- Thomas ändert Familie 2 – keine Zeile betroffen
update families set children = 'X' where id = :'f2';
reset role;
select children as f2_children_unchanged from families where id = :'f2';
set role authenticated;
-- ERROR 3: Thomas lädt eine Fachkraft für Familie 2 ein
select as_user(:'thomas');
select create_professional_invite(:'f2', 'Fremd', 30);
-- ERROR 4: Thomas legt eine Notiz in Familie 2 an
insert into journal (family_id, day, text) values (:'f2', '2026-10-10', 'fremd');

-- Sandra: Übersicht über alle drei, Gelesen-Markierung nur je Familie
select as_user(:'thomas');
insert into messages (family_id, text) values (:'f1', 'von Thomas');
select as_user(:'markus');
insert into messages (family_id, text) values (:'f2', 'von Markus');
select as_user(:'sandra');
select name_a, name_b, my_key, open_items from my_families_overview() order by name_b;
select mark_messages_read(:'f1');
select f.name_b, count(*) filter (where m.read_at is null and m.sender_key <> parent_key(f.id)) as unread
  from messages m join families f on f.id = m.family_id group by f.name_b order by f.name_b;
select count(*) as sandra_journal_f1 from journal where family_id = :'f1';

-- Testzeit je Familie: Familie 2 abgelaufen, Familie 1 nicht
reset role;
update families set joined_at = now() - interval '20 days' where id = :'f2';
set role authenticated;
select as_user(:'sandra');
select family_active(:'f1') as f1_active, family_active(:'f2') as f2_active;
-- ERROR 5: Schreiben in Familie 2 ohne Abo
insert into messages (family_id, text) values (:'f2', 'nach Testzeit');
insert into messages (family_id, text) values (:'f1', 'Familie 1 geht noch');

-- Fachkraft in Familie 1 sieht Familie 2 nicht
select create_professional_invite(:'f1', 'Jugendamt', 30) as pcode \gset
select as_user(:'thomas');
select approve_professional((select id from professional_access));
select as_user(:'pro');
select join_as_professional(:'pcode') = :'f1' as pro_joined;
select count(*) as pro_families from families;
select count(distinct family_id) as pro_message_families from messages;
-- ERROR 6: Fachkraft legt eine eigene Familie an
select create_family('x', 'y', 'z');

-- Kalender-Abo zeigt alle Familien von Sandra
reset role;
update families set schedule_model = 'wechsel_7_7', schedule_start = current_date where id in (:'f1', :'f2', :'f3');
insert into calendar_feeds (user_id, token) values (:'sandra', repeat('cd', 32));
select (select count(*) from regexp_matches(calendar_ics(repeat('cd', 32)), 'SUMMARY:(Mia|Leo|Emma) bei', 'g')) > 0 as all_kids,
       calendar_ics(repeat('cd', 32)) like '%SUMMARY:Mia bei%' and calendar_ics(repeat('cd', 32)) like '%SUMMARY:Leo bei%'
         and calendar_ics(repeat('cd', 32)) like '%SUMMARY:Emma bei%' as each_kid;

-- Sandra löscht ihr Konto: alle drei Familien bleiben für die Väter
set role authenticated;
select as_user(:'sandra');
select delete_my_account();
reset role;
select count(*) as families_kept from families where id in (:'f1', :'f2', :'f3');
