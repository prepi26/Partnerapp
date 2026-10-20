#!/bin/sh
# Spielt Attrappe + Schema (zweimal) + Tests ein. pg_net gibt es lokal nicht – die Zeile wird übersprungen.
S=$(dirname "$0")
D=$(dirname "$0")
sudo -u postgres psql -q -v ON_ERROR_STOP=1 < "$D/test-stub.sql" >/dev/null 2>&1
for i in 1 2; do
  grep -v "create extension if not exists pg_net" $S/schema.sql | sudo -u postgres psql -q -v ON_ERROR_STOP=1 -d zz 2>&1 | grep -v NOTICE
done
sudo -u postgres psql -q -d zz < "$1" 2>&1 | grep -v "^$" | grep -v "as_user\|^---\|^ *$\|(1 row)"
