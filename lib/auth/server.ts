import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Placeholders allow `next build` to collect page data when env vars are not
 * injected yet (common on first Netlify deploys). Real values must be set in
 * Netlify for sign-in to work at runtime.
 */
const baseUrl =
  process.env.NEON_AUTH_BASE_URL ??
  "https://placeholder.neonauth.invalid/neondb/auth";

const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ??
  "build-placeholder-secret-min-32-chars!";

if (
  process.env.NODE_ENV === "production" &&
  (!process.env.NEON_AUTH_BASE_URL || !process.env.NEON_AUTH_COOKIE_SECRET)
) {
  console.warn(
    "[bonsai] NEON_AUTH_BASE_URL and/or NEON_AUTH_COOKIE_SECRET are unset. " +
      "Auth will not work until you add them in Netlify → Environment variables.",
  );
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
  },
});
