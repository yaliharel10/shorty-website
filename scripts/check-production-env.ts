import { assertProductionEnv } from "../src/lib/production";

try {
  assertProductionEnv();
  console.log("Production environment validation passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
