// Applies db/schema.sql to the database in DATABASE_URL.
// Usage: node --env-file=.env.local scripts/init-db.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const schema = readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf8");
const sql = postgres(url, { prepare: false, ssl: "require" });

try {
  await sql.unsafe(schema);
  console.log("✓ Schema applied successfully.");
} catch (err) {
  console.error("✗ Failed to apply schema:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
