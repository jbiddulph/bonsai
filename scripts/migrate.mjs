/**
 * Applies SQL migrations from netlify/database/migrations.
 *
 * Why this exists:
 * Netlify Database auto-applies these files only when the Netlify Database
 * product is linked. This project currently uses DATABASE_URL (plain Neon),
 * so migrations do NOT appear in Neon Console and are NOT auto-run on deploy
 * unless we run this script.
 *
 * Tracked in public.__bonsai_migrations.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

function loadEnvFile() {
  try {
    const raw = readFileSync(".env", "utf8");
    for (const line of raw.split("\n")) {
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i < 0) continue;
      const key = line.slice(0, i);
      const value = line.slice(i + 1).replace(/^"|"$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env optional on Netlify (env injected)
  }
}

loadEnvFile();

const databaseUrl =
  process.env.NETLIFY_DATABASE_URL ??
  process.env.NETLIFY_DB_URL ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    "[migrate] No DATABASE_URL / NETLIFY_* URL — skipping migrations.",
  );
  process.exit(0);
}

const sql = neon(databaseUrl);
const root = join(process.cwd(), "netlify/database/migrations");

await sql.query(`
  CREATE TABLE IF NOT EXISTS "__bonsai_migrations" (
    id text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`);

const entries = readdirSync(root)
  .filter((name) => !name.startsWith("."))
  .sort();

const applied = await sql`select id from __bonsai_migrations`;
const appliedSet = new Set(applied.map((r) => r.id));

function loadMigration(name) {
  const full = join(root, name);
  const st = statSync(full);
  if (st.isDirectory()) {
    return {
      id: name,
      sql: readFileSync(join(full, "migration.sql"), "utf8"),
    };
  }
  if (name.endsWith(".sql")) {
    return { id: name.replace(/\.sql$/, ""), sql: readFileSync(full, "utf8") };
  }
  return null;
}

function splitStatements(source) {
  return source
    .split(";")
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
}

let ran = 0;
for (const name of entries) {
  const migration = loadMigration(name);
  if (!migration) continue;
  if (appliedSet.has(migration.id)) {
    console.log(`[migrate] skip ${migration.id}`);
    continue;
  }

  console.log(`[migrate] apply ${migration.id}`);
  const statements = splitStatements(migration.sql);
  for (const statement of statements) {
    try {
      await sql.query(statement);
    } catch (error) {
      const message = String(error.message ?? error);
      // Idempotent for environments where we applied SQL by hand earlier
      if (
        message.includes("already exists") ||
        message.includes("duplicate_object")
      ) {
        console.log(`  ignore: ${message.split("\n")[0]}`);
        continue;
      }
      console.error(`  failed on: ${statement.slice(0, 120)}…`);
      throw error;
    }
  }

  await sql`insert into __bonsai_migrations (id) values (${migration.id})`;
  ran += 1;
}

console.log(`[migrate] done (${ran} new)`);
