import { prisma } from "../src/lib/db";

async function main() {
  const [users, films] = await Promise.all([
    prisma.user.count(),
    prisma.film.count(),
  ]);

  if (users > 0 && films > 0) {
    console.log(
      `Database already seeded (${users} users, ${films} films). Skipping.`
    );
    return;
  }

  if (users > 0 || films > 0) {
    console.warn(
      `Partial database detected (${users} users, ${films} films). Skipping destructive seed. Use RUN_DB_SEED=true only on intentional empty/dev resets.`
    );
    return;
  }

  console.log("Empty database detected — running seed...");
  const { execSync } = await import("child_process");
  execSync("npm run db:seed", { stdio: "inherit" });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
