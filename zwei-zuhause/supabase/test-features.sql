-- Tests für Kind-Infos, Entscheidungen, Übergaben und Push: ./test-run.sh test-features.sql
insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b');
create or replace function public.as_user(u text) returns void language sql as $$ select set_config('request.jwt.claim.sub', u, false) $$;
grant execute on function public.as_user(text) to authenticated;
insert into push_tokens values ('ExpoPushToken[a]','00000000-0000-0000-0000-00000000000a');
set role authenticated;
select as_user('00000000-0000-0000-0000-00000000000a');
select create_family('Sandra','Thomas','Mia') as fam \gset
select my_invite_code(:'fam') as code \gset
select as_user('00000000-0000-0000-0000-00000000000b');
select join_family(:'code');
insert into messages (family_id, text) values (:'fam', 'Hi');
insert into child_info (family_id, category, label, value) values (:'fam', 'gesundheit','Kinderarzt','Dr. X');
update child_info set value='Dr. Y';
select label, value, updated_by is not null as has_by from child_info;
insert into decisions (family_id, title) values (:'fam', 'Klassenfahrt Italien');
select answer_decision((select id from decisions), true, '');
insert into handovers (family_id, day, status, minutes_late) values (:'fam', '2026-10-10','late',30);
update handovers set status='on_time';
delete from handovers;
select as_user('00000000-0000-0000-0000-00000000000a');
select answer_decision((select id from decisions), true, 'ok');
select reply_handover((select id from handovers), false, 'war pünktlich');
select status, answer_note from decisions; select status, reply, reply_note from handovers;

-- Lesebestätigungen ausschalten: B liest, ohne dass es markiert wird
select as_user('00000000-0000-0000-0000-00000000000a');
insert into messages (family_id, text) values (:'fam', 'Noch eine');
select as_user('00000000-0000-0000-0000-00000000000b');
select set_read_receipts(:'fam', false);
select mark_messages_read(:'fam');
select count(*) filter (where read_at is null and text = 'Noch eine') as stays_unread from messages;
select read_receipts_a, read_receipts_b from families;
