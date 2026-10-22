-- Tests für das Familien-Abo (14 Tage Test, danach nur lesen): ./test-run.sh test-subscription.sql
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000e1'),('00000000-0000-0000-0000-0000000000e2');
create or replace function public.as_user(u text) returns void language sql as $$ select set_config('request.jwt.claim.sub', u, false) $$;
grant execute on function public.as_user(text) to authenticated;
set role authenticated;
select as_user('00000000-0000-0000-0000-0000000000e1');
select create_family('Sandra','Thomas','Mia') as code \gset
insert into messages (text) values ('in der Testzeit');
insert into journal (day, text) values ('2026-10-10', 'Notiz');
select family_active() as active_in_trial;
-- Testzeit vorbei
reset role;
update families set created_at = now() - interval '20 days';
set role authenticated;
select as_user('00000000-0000-0000-0000-0000000000e1');
select family_active() as active_after_trial;
insert into messages (text) values ('nach der Testzeit');
insert into expenses (title, amount_cents, day, paid_by) values ('Jacke', 1000, '2026-10-10', 'a');
update families set children = 'X';
select count(*) as can_still_read from messages;
delete from journal; select count(*) as journal_deleted_left from journal;
select as_user('00000000-0000-0000-0000-0000000000e2');
select join_family(:'code') is not null as joined_after_trial;
-- Abo der Familie: beide dürfen wieder schreiben
reset role;
update families set plus_until = now() + interval '1 month';
set role authenticated;
select as_user('00000000-0000-0000-0000-0000000000e2');
insert into messages (text) values ('mit Abo');
select count(*) as msgs_now from messages;
