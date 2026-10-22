#!/bin/sh
# Lokales Mini-Supabase (Postgres, Auth, REST, Storage) in Docker + Gateway auf Port 54321.
# Danach: EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321 EXPO_PUBLIC_SUPABASE_ANON_KEY=<ANON aus keys.env> npx expo start --web
# Realtime fehlt bewusst – Live-Updates sieht man lokal erst nach Neuladen.
set -e
cd "$(dirname "$0")"
S=supabase-super-secret-jwt-token-with-at-least-32-characters-long
node keys.js > keys.env && . ./keys.env
docker network create zz 2>/dev/null || true
docker rm -f zzdb zzauth zzrest zzstorage >/dev/null 2>&1 || true
docker run -d --name zzdb --network zz -e POSTGRES_PASSWORD=pw -e JWT_SECRET=$S -p 55432:5432 supabase/postgres:15.8.1.085 >/dev/null
# Warten, bis Postgres im Container Verbindungen annimmt.
for i in $(seq 1 60); do
  docker exec -e PGPASSWORD=pw zzdb psql -h localhost -U supabase_admin -d postgres -tAc 'select 1' >/dev/null 2>&1 && break
  sleep 2
done
echo "alter role authenticator with password 'pw'; alter role supabase_auth_admin with password 'pw'; alter role supabase_storage_admin with password 'pw';" |
  docker exec -i -e PGPASSWORD=pw zzdb psql -h localhost -U supabase_admin -d postgres -q
docker run -d --name zzauth --network zz -e GOTRUE_API_HOST=0.0.0.0 -e PORT=9999 -e API_EXTERNAL_URL=http://localhost:54321 \
  -e GOTRUE_DB_DRIVER=postgres -e GOTRUE_DB_DATABASE_URL="postgres://supabase_auth_admin:pw@zzdb:5432/postgres" \
  -e GOTRUE_SITE_URL=http://localhost:8081 -e GOTRUE_JWT_SECRET=$S -e GOTRUE_JWT_EXP=3600 -e GOTRUE_JWT_AUD=authenticated -e GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated \
  -e GOTRUE_JWT_ADMIN_ROLES=service_role -e GOTRUE_DISABLE_SIGNUP=false -e GOTRUE_EXTERNAL_EMAIL_ENABLED=true \
  -e GOTRUE_MAILER_AUTOCONFIRM=true -e GOTRUE_SMTP_ADMIN_EMAIL=a@b.de -p 59999:9999 supabase/gotrue:v2.177.0 >/dev/null
docker run -d --name zzrest --network zz -e PGRST_DB_URI="postgres://authenticator:pw@zzdb:5432/postgres" \
  -e PGRST_DB_SCHEMAS=public,storage -e PGRST_DB_ANON_ROLE=anon -e PGRST_JWT_SECRET=$S -e PGRST_DB_USE_LEGACY_GUCS=false -p 53000:3000 postgrest/postgrest:v12.2.3 >/dev/null
docker run -d --name zzstorage --network zz -e ANON_KEY=$ANON -e SERVICE_KEY=$SERVICE -e POSTGREST_URL=http://zzrest:3000 \
  -e PGRST_JWT_SECRET=$S -e AUTH_JWT_SECRET=$S -e DATABASE_URL="postgres://supabase_storage_admin:pw@zzdb:5432/postgres" \
  -e FILE_SIZE_LIMIT=52428800 -e STORAGE_BACKEND=file -e FILE_STORAGE_BACKEND_PATH=/var/lib/storage -e TENANT_ID=stub \
  -e REGION=local -e GLOBAL_S3_BUCKET=stub -e ENABLE_IMAGE_TRANSFORMATION=false -p 55000:5000 supabase/storage-api:v1.25.7 >/dev/null
# Warten, bis der Speicherdienst seine Tabellen angelegt hat – sonst scheitert schema.sql an storage.buckets.
for i in $(seq 1 60); do
  docker exec -e PGPASSWORD=pw zzdb psql -h localhost -U postgres -d postgres -tAc \
    "select 1 from information_schema.columns where table_schema='storage' and table_name='buckets' and column_name='public'" | grep -q 1 && break
  sleep 2
done
docker exec -i -e PGPASSWORD=pw zzdb psql -h localhost -U postgres -d postgres -v ON_ERROR_STOP=1 -q < ../supabase/schema.sql
docker kill -s SIGUSR1 zzrest >/dev/null
node gateway.js &
echo "Bereit. ANON-Key: $ANON"
