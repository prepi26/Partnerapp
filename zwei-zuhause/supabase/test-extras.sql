-- Tests für Unterhalt, Packliste und Kalender-Abo: ./test-run.sh test-extras.sql → erwartet 3 ERROR-Zeilen
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000f1'),('00000000-0000-0000-0000-0000000000f2');
create or replace function public.as_user(u text) returns void language sql as $$ select set_config('request.jwt.claim.sub', u, false) $$;
grant execute on function public.as_user(text) to authenticated;
set role authenticated;
select as_user('00000000-0000-0000-0000-0000000000f1');
select create_family('Anna','Ben','Mia, Leo') as fam \gset
select my_invite_code(:'fam') as code \gset
select as_user('00000000-0000-0000-0000-0000000000f2');
select join_family(:'code') is not null as joined;

-- Unterhalt: Ben (b) zahlt 400 € ab Oktober
insert into maintenance_terms (family_id, payer, amount_cents, valid_from, basis) values (:'fam', 'b', 40000, '2026-10-01', 'Jugendamtsurkunde');
-- ERROR 1: Soll nur ab Monatsanfang
insert into maintenance_terms (family_id, payer, amount_cents, valid_from) values (:'fam', 'b', 40000, '2026-10-15');
-- Ben trägt seine Zahlung ein → offen
insert into maintenance_payments (family_id, payer, month, amount_cents, paid_on, status) values (:'fam', 'b', '2026-10-01', 40000, '2026-10-01', 'confirmed');
select status as own_payment_status from maintenance_payments;
-- ERROR 2: selbst bestätigen geht nicht
select answer_maintenance((select id from maintenance_payments limit 1), true);
-- Soll lässt sich nicht ändern (keine Update-Regel: 0 Zeilen, kein Fehler)
update maintenance_terms set amount_cents = 1;
select amount_cents as term_unchanged from maintenance_terms;
-- Anna bestätigt
select as_user('00000000-0000-0000-0000-0000000000f1');
select answer_maintenance((select id from maintenance_payments limit 1), true);
select status as after_confirm from maintenance_payments;
-- Anna trägt Erhalt für November ein → gleich bestätigt
insert into maintenance_payments (family_id, payer, month, amount_cents, paid_on) values (:'fam', 'b', '2026-11-01', 20000, '2026-11-03');
select month, status from maintenance_payments order by month;
-- Bestätigte Einträge lassen sich nicht löschen
delete from maintenance_payments;
select count(*) as payments_kept from maintenance_payments;

-- Packliste
insert into packing_items (family_id, label, recurring) values (:'fam', 'Asthmaspray', true), (:'fam', 'Schwimmsachen', false), (:'fam', 'Turnbeutel', false);
update packing_items set packed = true where label in ('Asthmaspray', 'Schwimmsachen');
update packing_items set holder = 'b' where label = 'Turnbeutel';
select as_user('00000000-0000-0000-0000-0000000000f2');
select count(*) as other_sees_items from packing_items;
select reset_packing(:'fam');
select label, packed, holder from packing_items order by label;

-- Kalender-Abo
reset role;
update families set schedule_model = 'wechsel_7_7', schedule_start = current_date - 3, schedule_first = 'a',
  handover_time = '17:00', handover_place = 'Kita Sonne, Eingang';
set role authenticated;
select as_user('00000000-0000-0000-0000-0000000000f1');
select my_calendar_token('de') as token \gset
select my_calendar_token('de') = :'token' as token_stable;
select my_calendar_token('en', true) <> :'token' as token_renewed;
select my_calendar_token('de') as token \gset
-- ERROR 3: Eltern dürfen den Kalender nicht direkt abrufen (nur die Edge Function mit service_role)
select calendar_ics(:'token') is not null;
reset role;
select calendar_ics('falsch') is null as unknown_token_null;
select (select count(*) from regexp_matches(calendar_ics(:'token'), 'BEGIN:VEVENT', 'g')) > 50 as many_events;
select split_part(split_part(calendar_ics(:'token'), 'SUMMARY:Mia\, Leo bei', 1), 'DTSTART', 1) is not null as ok;
select substring(calendar_ics(:'token') from 'SUMMARY:[^\r]*Übergabe[^\r]*') as handover_summary;
select substring(calendar_ics(:'token') from 'LOCATION:[^\r]*') as location;
select (select count(*) from regexp_matches(calendar_ics(:'token'), 'SUMMARY:Mia\\, Leo bei Anna', 'g')) > 0 as stay_summary;
-- Nach dem Abschalten ist die Adresse tot
set role authenticated;
select as_user('00000000-0000-0000-0000-0000000000f1');
select stop_calendar_feed();
reset role;
select calendar_ics(:'token') is null as feed_stopped;
