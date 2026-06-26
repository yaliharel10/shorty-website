import { execSync } from "node:child_process";
import { createClient } from "@libsql/client";

function parseSqlStatements(sql: string): string[] {
  const withoutComments = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  return withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function tursoDatabaseUrl() {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!url || !authToken) return null;
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}authToken=${authToken}`;
}

function generateSchemaSql(mode: "incremental" | "empty") {
  if (mode === "incremental") {
    const databaseUrl = tursoDatabaseUrl();
    if (!databaseUrl) throw new Error("Turso credentials missing");

    return execSync(
      `npx prisma migrate diff --from-url "${databaseUrl}" --to-schema-datamodel prisma/schema.prisma --script`,
      {
        encoding: "utf-8",
        env: { ...process.env, DATABASE_URL: databaseUrl },
      }
    );
  }

  return execSync(
    "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
    { encoding: "utf-8" }
  );
}

function isIgnorableSqlError(message: string) {
  return (
    message.includes("already exists") ||
    message.includes("duplicate column") ||
    message.includes("UNIQUE constraint failed") ||
    message.includes("no such table") // DROP on already-removed legacy tables
  );
}

async function applyStatements(client: ReturnType<typeof createClient>, statements: string[]) {
  let applied = 0;
  let skipped = 0;

  for (const statement of statements) {
    try {
      await client.execute(`${statement};`);
      applied += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isIgnorableSqlError(message)) {
        skipped += 1;
        continue;
      }
      console.error("Failed statement:", statement.slice(0, 300));
      throw error;
    }
  }

  console.log(`Applied ${applied} statements (${skipped} skipped as already applied).`);
}

async function tableExists(client: ReturnType<typeof createClient>, name: string) {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    args: [name],
  });
  return result.rows.length > 0;
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!url || !authToken) {
    console.log("No Turso credentials — skipping remote schema setup (local SQLite build).");
    return;
  }

  const client = createClient({ url, authToken });
  const hasUserTable = await tableExists(client, "User");

  let sql: string;
  if (hasUserTable) {
    console.log("Existing Turso database detected — applying incremental schema diff...");
    try {
      sql = generateSchemaSql("incremental");
    } catch (error) {
      console.warn("Incremental diff failed, falling back to from-empty script:", error);
      sql = generateSchemaSql("empty");
    }
  } else {
    console.log("Empty Turso database — applying full schema...");
    sql = generateSchemaSql("empty");
  }

  const statements = parseSqlStatements(sql);
  if (statements.length === 0) {
    console.log("Turso schema is already up to date.");
    return;
  }

  console.log(`Applying ${statements.length} statements to Turso...`);
  await applyStatements(client, statements);
  console.log("Turso schema ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
