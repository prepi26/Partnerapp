-- Tests für Dokumente: ./test-run.sh test-documents.sql
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1'),('00000000-0000-0000-0000-0000000000b1'),('00000000-0000-0000-0000-0000000000c1');
create or replace function public.as_user(u text) returns void language sql as $$ select set_config('request.jwt.claim.sub', u, false) $$;
grant execute on function public.as_user(text) to authenticated;
set role authenticated;
select as_user('00000000-0000-0000-0000-0000000000a1');
select create_family('Sandra','Thomas','Mia');
select (select id from families)::text as fid \gset
-- ohne Einwilligung kein Gesundheitsdokument
insert into documents (family_id, title, category, file_path) values (:'fid', 'Arztbrief', 'gesundheit', :'fid' || '/a.pdf');
insert into documents (family_id, title, category, file_path, health_consent_at) values (:'fid', 'Arztbrief', 'gesundheit', :'fid' || '/a.pdf', '2000-01-01');
select title, health_consent_at > '2020-01-01' as consent_time_from_server from documents;
-- Pfad muss im eigenen Familienordner liegen
insert into documents (family_id, title, file_path) values (:'fid', 'fremd', 'andere-familie/x.pdf');
insert into documents (family_id, title, file_path) values (:'fid', 'Zeugnis', :'fid' || '/z.pdf');
select as_user('00000000-0000-0000-0000-0000000000c1');
select count(*) as stranger_sees from documents;
select as_user('00000000-0000-0000-0000-0000000000a1');
select count(*) as a_sees from documents;
