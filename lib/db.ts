import { neon } from "@neondatabase/serverless";

function firstNonEmpty(...values: Array<string | undefined>) {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}

/**
 * Prefer explicit DATABASE_URL (your Neon project) over Netlify-injected
 * NETLIFY_DB_URL / NETLIFY_DATABASE_URL. Those point at a *different*
 * Netlify Database host, which is why Console on your Neon project looked empty.
 */
export function getDatabaseUrl() {
  return firstNonEmpty(
    process.env.DATABASE_URL,
    process.env.NETLIFY_DATABASE_URL,
    process.env.NETLIFY_DB_URL,
  );
}

export function describeDatabaseTarget(url = getDatabaseUrl()) {
  if (!url) return { configured: false as const };
  try {
    const parsed = new URL(url.replace(/^postgresql:/, "postgres:"));
    return {
      configured: true as const,
      host: parsed.host,
      database: parsed.pathname.replace(/^\//, "") || "neondb",
      isNetlifyDatabase: parsed.host.includes("db.netlify.com"),
    };
  } catch {
    return { configured: true as const, host: "unparseable", database: "?", isNetlifyDatabase: false };
  }
}

export function getSql() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "Missing database URL. Set DATABASE_URL to your Neon pooled connection string in Netlify → Environment variables, then redeploy.",
    );
  }
  return neon(url);
}
