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

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.log("No Turso credentials — skipping remote schema setup (local SQLite build).");
    return;
  }

  console.log("Generating schema SQL from Prisma...");
  const sql = execSync(
    "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
    { encoding: "utf-8" }
  );

  const statements = parseSqlStatements(sql);
  if (statements.length === 0) {
    throw new Error("No SQL statements generated — cannot set up Turso schema");
  }

  const client = createClient({ url, authToken });

  console.log(`Applying ${statements.length} statements to Turso...`);

  for (const statement of statements) {
    try {
      await client.execute(`${statement};`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes("already exists") ||
        message.includes("duplicate column") ||
        message.includes("UNIQUE constraint failed")
      ) {
        continue;
      }
      console.error("Failed statement:", statement.slice(0, 200));
      throw error;
    }
  }

  console.log("Turso schema ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
