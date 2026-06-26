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

  // User preferences
  `ALTER TABLE "User" ADD COLUMN "autoplayNext" BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE "User" ADD COLUMN "playbackSpeed" REAL NOT NULL DEFAULT 1`,
  `ALTER TABLE "User" ADD COLUMN "subtitleLanguage" TEXT NOT NULL DEFAULT 'en'`,
  `ALTER TABLE "User" ADD COLUMN "reduceMotionPref" BOOLEAN NOT NULL DEFAULT false`,

  `CREATE TABLE IF NOT EXISTS "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "isKids" BOOLEAN NOT NULL DEFAULT false,
    "pinHash" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Profile_userId_idx" ON "Profile"("userId")`,

  `CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt")`,

  // View duration for payout analytics
  `ALTER TABLE "ViewEvent" ADD COLUMN "watchSeconds" INTEGER NOT NULL DEFAULT 0`,
  `CREATE INDEX IF NOT EXISTS "ViewEvent_filmId_createdAt_idx" ON "ViewEvent"("filmId", "createdAt")`,

  // Admin payout / revenue settings
  `CREATE TABLE IF NOT EXISTS "PlatformSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "creatorPoolPercent" REAL NOT NULL DEFAULT 50,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `INSERT OR IGNORE INTO "PlatformSettings" ("id", "creatorPoolPercent", "updatedAt") VALUES ('default', 50, CURRENT_TIMESTAMP)`,
];

export function isIgnorablePatchError(message: string) {
  return (
    message.includes("duplicate column") ||
    message.includes("already exists") ||
    message.includes("UNIQUE constraint failed")
  );
}
