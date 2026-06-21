#!/usr/bin/env bash
set -euo pipefail

if [ -n "${TURSO_DATABASE_URL:-}" ] && [ -n "${TURSO_AUTH_TOKEN:-}" ]; then
  export DATABASE_URL="${TURSO_DATABASE_URL}?authToken=${TURSO_AUTH_TOKEN}"
fi

npx prisma generate
npx prisma db push --accept-data-loss
npm run db:seed
next build
