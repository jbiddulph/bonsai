import { neon } from "@neondatabase/serverless";

/**
 * Connection string resolution order for Netlify + Neon:
 * 1. NETLIFY_DATABASE_URL — Netlify Neon extension
 * 2. NETLIFY_DB_URL — Netlify Database (@netlify/database)
 * 3. DATABASE_URL — manual / local
 */
export function getDatabaseUrl() {
  return (
    process.env.NETLIFY_DATABASE_URL ??
    process.env.NETLIFY_DB_URL ??
    process.env.DATABASE_URL
  );
}

export function getSql() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "Missing database URL. Set NETLIFY_DATABASE_URL, NETLIFY_DB_URL, or DATABASE_URL.",
    );
  }
  return neon(url);
}
