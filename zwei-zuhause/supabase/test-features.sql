-- Tests für Kind-Infos, Entscheidungen, Übergaben und Push: ./test-run.sh test-features.sql
insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b');
create or replace function public.as_user(u text) returns void language sql as $$ select set_config('request.jwt.claim.sub', u, false) $$;
grant execute on function public.as_user(text) to authenticated;
insert into push_tokens values ('ExpoPushToken[a]','00000000-0000-0000-0000-00000000000a');
set role authenticated;
select as_user('00000000-0000-0000-0000-00000000000a');
select create_family('Sandra','Thomas','Mia') as code \gset
select as_user('00000000-0000-0000-0000-00000000000b');
select join_family(:'code');
insert into messages (text) values ('Hi');
insert into child_info (category, label, value) values ('gesundheit','Kinderarzt','Dr. X');
update child_info set value='Dr. Y';
select label, value, updated_by is not null as has_by from child_info;
insert into decisions (title) values ('Klassenfahrt Italien');
select answer_decision((select id from decisions), true, '');
insert into handovers (day, status, minutes_late) values ('2026-10-10','late',30);
update handovers set status='on_time';
delete from handovers;
select as_user('00000000-0000-0000-0000-00000000000a');
select answer_decision((select id from decisions), true, 'ok');
select reply_handover((select id from handovers), false, 'war pünktlich');
select status, answer_note from decisions; select status, reply, reply_note from handovers;
