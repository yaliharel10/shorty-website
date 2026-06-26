import { execSync } from "node:child_process";
import { createClient } from "@libsql/client";
import { isIgnorablePatchError, TURSO_SCHEMA_PATCHES } from "./turso-patches";

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

async function applyStatements(
  client: ReturnType<typeof createClient>,
  statements: string[],
  label: string
) {
  let applied = 0;
  let skipped = 0;

  for (const statement of statements) {
    try {
      await client.execute(`${statement};`);
      applied += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isIgnorablePatchError(message)) {
        skipped += 1;
        continue;
      }
      console.error(`[${label}] Failed:`, statement.slice(0, 200));
      throw error;
    }
  }

  console.log(`[${label}] Applied ${applied} (${skipped} skipped).`);
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

  // Always run explicit patches first — reliable on libsql/Turso.
  console.log("Applying explicit Turso schema patches...");
  await applyStatements(client, TURSO_SCHEMA_PATCHES, "patches");

  const hasUserTable = await tableExists(client, "User");

  if (hasUserTable) {
    const databaseUrl = tursoDatabaseUrl();
    if (databaseUrl) {
      try {
        console.log("Attempting Prisma incremental diff...");
        const sql = execSync(
          `npx prisma migrate diff --from-url "${databaseUrl}" --to-schema-datamodel prisma/schema.prisma --script`,
          {
            encoding: "utf-8",
            env: { ...process.env, DATABASE_URL: databaseUrl },
          }
        );
        const statements = parseSqlStatements(sql);
        if (statements.length > 0) {
          await applyStatements(client, statements, "prisma-diff");
        }
      } catch (error) {
        console.warn("Prisma incremental diff skipped:", error);
      }
    }
  } else {
    console.log("Empty Turso database — applying full schema from Prisma...");
    const sql = execSync(
      "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
      { encoding: "utf-8" }
    );
    await applyStatements(client, parseSqlStatements(sql), "from-empty");
  }

  console.log("Turso schema ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
