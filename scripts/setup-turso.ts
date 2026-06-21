import { execSync } from "node:child_process";
import { createClient } from "@libsql/client";

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

  const client = createClient({ url, authToken });

  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

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
      console.error("Failed statement:", statement.slice(0, 120));
      throw error;
    }
  }

  console.log("Turso schema ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
