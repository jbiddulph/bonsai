import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import { getDatabaseUrl } from "@/lib/db";

export function getDb() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "Missing database URL. Set NETLIFY_DATABASE_URL, NETLIFY_DB_URL, or DATABASE_URL.",
    );
  }
  return drizzle(neon(url), { schema });
}
