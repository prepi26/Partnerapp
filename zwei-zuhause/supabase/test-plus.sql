-- Abo-Stufen: ./test-run.sh test-plus.sql (apply_plus läuft als service_role, hier als postgres)
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000005b0'), ('00000000-0000-0000-0000-0000000007b0'), ('00000000-0000-0000-0000-0000000008b0');
create or replace function public.as_user(u text) returns void language sql as $$ select set_config('request.jwt.claim.sub', u, false) $$;
grant execute on function public.as_user(text) to authenticated;
set role authenticated;
select as_user('00000000-0000-0000-0000-0000000005b0');
select create_family('Sandra', 'Thomas', 'Mia') as f1 \gset
select create_family('Sandra', 'Markus', 'Leo') as f2 \gset
select create_family('Sandra', 'Ali', 'Emma') as f3 \gset
select create_family('Sandra', 'Jan', 'Ida') as f4 \gset
-- ERROR 1: Eltern können apply_plus nicht selbst aufrufen
select apply_plus('00000000-0000-0000-0000-0000000005b0', now() + interval '1 year', 3, null);
reset role;
-- Plus (1 Familie), gekauft in Familie 2
select apply_plus('00000000-0000-0000-0000-0000000005b0', now() + interval '1 month', 1, :'f2') as covered;
select children, plus_until > now() as plus from families order by created_at;
-- Upgrade auf Mehrfamilie (3), wieder aus Familie 2 – Familie 2 bleibt, dazu die ältesten
select apply_plus('00000000-0000-0000-0000-0000000005b0', now() + interval '1 month', 3, :'f2') as covered;
select children, plus_until > now() as plus from families order by created_at;
-- Thomas zahlt selbst für Familie 1 → Sandras Platz rutscht weiter (Familie 4)
update families set parent_b = '00000000-0000-0000-0000-0000000007b0' where id = :'f1';
select apply_plus('00000000-0000-0000-0000-0000000007b0', now() + interval '1 year', 1, :'f1') as thomas_covered;
select apply_plus('00000000-0000-0000-0000-0000000005b0', now() + interval '1 month', 3, null) as covered;
select children, plus_payer = '00000000-0000-0000-0000-0000000007b0' as by_thomas, plus_until > now() as plus from families order by created_at;
-- Sandras Abo endet
select apply_plus('00000000-0000-0000-0000-0000000005b0', now() - interval '1 day', 0, null) as covered;
select children, plus_until > now() as plus from families order by created_at;
