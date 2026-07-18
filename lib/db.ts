import { neon } from "@neondatabase/serverless";

/**
 * Prefer Netlify Neon extension URL when present, otherwise DATABASE_URL.
 * @see https://app.netlify.com/extensions/neon
 */
export function getDatabaseUrl() {
  return process.env.NETLIFY_DATABASE_URL ?? process.env.DATABASE_URL;
}

export function getSql() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "Missing database URL. Set NETLIFY_DATABASE_URL (Netlify Neon extension) or DATABASE_URL.",
    );
  }
  return neon(url);
}
