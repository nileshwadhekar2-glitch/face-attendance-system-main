#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@17/bin}"
if ! "$PG_BIN/pg_ctl" -D .local/postgres status >/dev/null 2>&1; then
  "$PG_BIN/pg_ctl" -D .local/postgres -l .local/postgres.log -o '-h 127.0.0.1 -p 5433 -k /private/tmp' start
fi
(cd server && npm start) &
backend_pid=$!
(cd client && npm run dev -- --host 127.0.0.1) &
frontend_pid=$!
trap 'kill "$backend_pid" "$frontend_pid" 2>/dev/null || true' EXIT INT TERM
wait
