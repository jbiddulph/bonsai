import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

/**
 * Build-time placeholders so `next build` can collect route data.
 * At runtime these must be real Netlify env vars or auth will fail loudly.
 */
const isPlaceholder =
  !baseUrl ||
  !cookieSecret ||
  baseUrl.includes("placeholder") ||
  baseUrl.startsWith("postgresql:");

if (isPlaceholder && process.env.NEXT_PHASE !== "phase-production-build") {
  console.error(
    "[bonsai] NEON_AUTH_BASE_URL must be the Auth URL from Neon Console → Auth → Configuration.\n" +
      "  Expected: https://ep-….neonauth.…aws.neon.tech/neondb/auth\n" +
      "  Not a postgresql:// connection string.\n" +
      "  Set it in Netlify → Environment variables, then redeploy.",
  );
}

export const auth = createNeonAuth({
  baseUrl: baseUrl ?? "https://placeholder.neonauth.invalid/neondb/auth",
  cookies: {
    secret: cookieSecret ?? "build-placeholder-secret-min-32-chars!",
  },
});
