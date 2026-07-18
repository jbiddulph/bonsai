import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import { getDatabaseUrl } from "@/lib/db";

export function getDb() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "Missing database URL. Set DATABASE_URL in Netlify → Environment variables (non-empty), then redeploy.",
    );
  }
  return drizzle(neon(url), { schema });
}
