#!/usr/bin/env bash
set -euo pipefail

if [ "${VERCEL:-}" = "1" ] && [ -z "${JWT_SECRET:-}" ]; then
  echo "ERROR: JWT_SECRET must be set in Vercel environment variables for production."
  exit 1
fi

if [ "${VERCEL:-}" = "1" ]; then
  echo "Validating production environment..."
  npx tsx scripts/check-production-env.ts
fi

npx prisma generate

if [ -n "${TURSO_DATABASE_URL:-}" ] && [ -n "${TURSO_AUTH_TOKEN:-}" ]; then
  echo "Setting up Turso database..."
  npx tsx scripts/setup-turso.ts
else
  echo "No Turso env vars — using local SQLite for schema push..."
  npx prisma db push --accept-data-loss
fi

if [ "${RUN_DB_SEED:-}" = "true" ]; then
  echo "RUN_DB_SEED=true — forcing full database seed..."
  npm run db:seed
else
  echo "Checking if database needs initial seed..."
  npx tsx scripts/seed-if-empty.ts
fi

next build
