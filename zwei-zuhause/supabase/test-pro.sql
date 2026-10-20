-- Tests für Elternvereinbarung und Fachkraft-Zugang: ./test-run.sh test-pro.sql
insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b'),('00000000-0000-0000-0000-00000000000f');
create or replace function public.as_user(u text) returns void language sql as $$ select set_config('request.jwt.claim.sub', u, false) $$;
grant execute on function public.as_user(text) to authenticated;
set role authenticated;
select as_user('00000000-0000-0000-0000-00000000000a');
select create_family('Sandra','Thomas','Mia') as code \gset
insert into agreements (content) values ('{"rhythmus":"7/7"}');
select version, accepted_a_at is not null as a_ok, accepted_b_at is not null as b_ok, length(hash) from agreements;
select as_user('00000000-0000-0000-0000-00000000000b');
select join_family(:'code');
select accept_agreement((select id from agreements));
update agreements set content = '{"x":1}';
insert into agreements (content) values ('{"rhythmus":"2-2-5-5"}');
select version, accepted_a_at is not null as a_ok, accepted_b_at is not null as b_ok from agreements order by version;
select as_user('00000000-0000-0000-0000-00000000000a');
select accept_agreement((select id from agreements where version = 1));
select create_professional_invite('Jugendamt Musterstadt', 30) as pcode \gset
select as_user('00000000-0000-0000-0000-00000000000f');
select join_as_professional(:'pcode');
select count(*) as before_approval from messages;
select count(*) as fam_before from families;
select as_user('00000000-0000-0000-0000-00000000000b');
insert into messages (text) values ('Hallo');
insert into journal (day, text) values ('2026-10-10','privat');
select approve_professional((select id from professional_access));
select as_user('00000000-0000-0000-0000-00000000000f');
select count(*) as msgs_after from messages; select count(*) as journal_seen from journal; select count(*) as agreements_seen from agreements;
insert into messages (text, family_id) values ('pro schreibt', (select id from families));
update families set children = 'X';
select join_family(:'code');
select create_family('a','b','c');
select as_user('00000000-0000-0000-0000-00000000000a');
select revoke_professional((select id from professional_access));
select as_user('00000000-0000-0000-0000-00000000000f');
select count(*) as msgs_after_revoke from messages;
