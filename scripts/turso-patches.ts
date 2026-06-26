/**
 * Idempotent Turso/SQLite patches for production databases created before
 * the streaming schema expansion. Prisma migrate diff --from-url does not
 * reliably work against libsql URLs on Vercel, so we apply these directly.
 */
export const TURSO_SCHEMA_PATCHES: string[] = [
  // Film metadata columns
  `ALTER TABLE "Film" ADD COLUMN "genres" TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "Film" ADD COLUMN "moods" TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "Film" ADD COLUMN "tags" TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "Film" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en'`,
  `ALTER TABLE "Film" ADD COLUMN "country" TEXT`,
  `ALTER TABLE "Film" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE "Film" ADD COLUMN "trendingScore" REAL NOT NULL DEFAULT 0`,

  // Collections
  `CREATE TABLE IF NOT EXISTS "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "heroUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT,
    "mood" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Collection_slug_key" ON "Collection"("slug")`,
  `CREATE INDEX IF NOT EXISTS "Collection_featured_sortOrder_idx" ON "Collection"("featured", "sortOrder")`,

  `CREATE TABLE IF NOT EXISTS "CollectionFilm" (
    "collectionId" TEXT NOT NULL,
    "filmId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("collectionId", "filmId"),
    CONSTRAINT "CollectionFilm_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionFilm_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "CollectionFilm_collectionId_sortOrder_idx" ON "CollectionFilm"("collectionId", "sortOrder")`,

  // Backfill published for any legacy rows
  `UPDATE "Film" SET "published" = true WHERE "published" IS NULL`,
];

export function isIgnorablePatchError(message: string) {
  return (
    message.includes("duplicate column") ||
    message.includes("already exists") ||
    message.includes("UNIQUE constraint failed")
  );
}
