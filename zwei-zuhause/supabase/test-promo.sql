-- Tests für Gutscheincodes: ./test-run.sh test-promo.sql → erwartet 2 ERROR-Zeilen
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1'),('00000000-0000-0000-0000-0000000000a2'),('00000000-0000-0000-0000-0000000000a3');
insert into promo_codes (code, label, days, max_uses) values ('JA-AACHEN', 'Jugendamt Aachen', 90, 1);
create or replace function public.as_user(u text) returns void language sql as $$ select set_config('request.jwt.claim.sub', u, false) $$;
grant execute on function public.as_user(text) to authenticated;
set role authenticated;
select as_user('00000000-0000-0000-0000-0000000000a1');
select create_family('Anna','Ben','Mia') as fam \gset
-- ERROR 1: Codes lassen sich nicht auslesen
select * from promo_stats;
select count(*) as codes_visible from promo_codes;
select redeem_promo_code(:'fam', 'falsch') is null as wrong_code_null;
-- Allein seit 40 Tagen, Testzeit vorbei: Code gibt 90 Tage ab heute
reset role;
update families set created_at = now() - interval '40 days';
set role authenticated;
select as_user('00000000-0000-0000-0000-0000000000a1');
select family_active(:'fam') as active_before;
select round(extract(epoch from redeem_promo_code(:'fam', ' ja-aachen ') - now()) / 86400) as days_free;
select family_active(:'fam') as active_after;
-- ERROR 2: nur ein Code pro Familie
select redeem_promo_code(:'fam', 'JA-AACHEN');
-- Andere Familie: Code ist aufgebraucht (max_uses 1)
select as_user('00000000-0000-0000-0000-0000000000a3');
select create_family('Carla','Dirk','') as fam2 \gset
select redeem_promo_code(:'fam2', 'JA-AACHEN') is null as used_up;
reset role;
select code, families from promo_stats;
