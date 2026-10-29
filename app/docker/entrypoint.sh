#!/bin/sh
# Container Meraki: migra antes de servir; seed só fora de produção.
set -eu
umask 077

: "${DATA_PATH:=./data}"
mkdir -p "$DATA_PATH/attachments"

deno_run() {
  exec deno run --cached-only \
    --allow-net --allow-env --allow-read --allow-write \
    --allow-sys=hostname,networkInterfaces \
    src/main.ts "$@"
}

case "${1:-serve}" in
  serve)
    if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
      echo "[meraki] aplicando migrações..."
      deno run --cached-only --allow-net --allow-env --allow-read --allow-write \
        --allow-sys=hostname,networkInterfaces src/main.ts migrate
    fi
    if [ "${APP_ENV:-development}" != "production" ] && [ "${SEED_ON_BOOT:-true}" = "true" ]; then
      echo "[meraki] aplicando seed de desenvolvimento..."
      deno run --cached-only --allow-net --allow-env --allow-read --allow-write \
        --allow-sys=hostname,networkInterfaces src/main.ts seed
    fi
    deno_run
    ;;
  migrate|seed|db:reset|backup|restore|doctor|create-admin|push:keys)
    deno_run "$@"
    ;;
  *)
    exec "$@"
    ;;
esac
