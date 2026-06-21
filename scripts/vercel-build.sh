#!/usr/bin/env bash
set -euo pipefail

npx prisma generate

if [ -n "${TURSO_DATABASE_URL:-}" ] && [ -n "${TURSO_AUTH_TOKEN:-}" ]; then
  echo "Setting up Turso database..."
  npx tsx scripts/setup-turso.ts
else
  echo "No Turso env vars — using local SQLite for schema push..."
  npx prisma db push --accept-data-loss
fi

npm run db:seed
next build
