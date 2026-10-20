-- Rechte-Tests für schema.sql: ./test-run.sh test-rls.sql (lokales Postgres mit Supabase-Attrappe).
\set ON_ERROR_STOP 0
insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b'),('00000000-0000-0000-0000-00000000000c');
create or replace function public.as_user(u text) returns void language sql as $$ select set_config('request.jwt.claim.sub', u, false) $$;
grant execute on function public.as_user(text) to authenticated;
set role authenticated;
select as_user('00000000-0000-0000-0000-00000000000a');
select create_family('Sandra','Thomas','Mia') as code \gset
select my_parent_key() as a_key, other_parent_present() as other_present;
-- A alone: propose + self-accept
insert into schedule_changes (day, parent, note) values ('2026-11-01','a','Oma');
select answer_schedule_change((select id from schedule_changes limit 1), true);
select status from schedule_changes;
-- message without partner
insert into messages (text) values ('Hallo 1');
select as_user('00000000-0000-0000-0000-00000000000b');
select join_family(:'code');
select my_parent_key() as b_key;
insert into messages (text, sender_key, created_at) values ('Hallo 2 fake', 'a', '2000-01-01');
select seq, sender_key, text, created_at > '2020-01-01' as real_time, left(hash,12) from messages order by seq;
update messages set text='geändert';
delete from messages;
select count(*) as msgs_after_delete from messages;
-- B marks read
select mark_messages_read();
select sender_key, read_at is not null as read from messages order by seq;
-- B proposes, B cannot accept own
insert into schedule_changes (day, parent) values ('2026-11-02','b');
select answer_schedule_change((select id from schedule_changes where day='2026-11-02'), true);
-- expenses
insert into expenses (title, amount_cents, day, paid_by, share_a) values ('Jacke', 8000, '2026-10-10', 'b', 50);
select answer_expense((select id from expenses limit 1), true);
select as_user('00000000-0000-0000-0000-00000000000a');
select answer_schedule_change((select id from schedule_changes where day='2026-11-02'), false);
select answer_expense((select id from expenses limit 1), true);
select status from expenses;
-- B can't delete confirmed
select as_user('00000000-0000-0000-0000-00000000000b');
delete from expenses; select count(*) as exp_left from expenses;
-- B can't change membership
update families set parent_a = '00000000-0000-0000-0000-00000000000c';
update families set schedule_model='wechsel_7_7';
select schedule_model from families;
-- journal private
insert into journal (day, text) values ('2026-10-10','B privat');
select as_user('00000000-0000-0000-0000-00000000000a');
select count(*) as a_sees_b_journal from journal;
-- stranger
select as_user('00000000-0000-0000-0000-00000000000c');
select count(*) as c_fam from families; select count(*) as c_msgs from messages;
insert into messages (text, family_id) values ('hack', (select id from families limit 1));
select join_family(:'code');
-- delete account A: family stays for B
select as_user('00000000-0000-0000-0000-00000000000a');
select delete_my_account();
reset role;
select parent_a is null as a_gone, parent_b is not null as b_kept, (select count(*) from messages) as msgs from families;
set role authenticated;
select as_user('00000000-0000-0000-0000-00000000000b');
select my_parent_key(), other_parent_present();
select delete_my_account();
reset role;
select count(*) as families_left from families;
