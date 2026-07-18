import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Lightweight check that production can reach Postgres. No secrets returned. */
export async function GET() {
  const url = getDatabaseUrl();
  if (!url) {
    return NextResponse.json(
      {
        ok: false,
        database: "missing",
        hint: "Set a non-empty DATABASE_URL on Netlify and redeploy",
        openai: Boolean(process.env.OPENAI_API_KEY),
      },
      { status: 500 },
    );
  }

  try {
    const host = new URL(url.replace("postgresql://", "postgres://")).host;
    const sql = neon(url);
    const [row] = await sql`select count(*)::int as profiles from profiles`;
    const [plans] = await sql`select count(*)::int as plans from meal_plans`;
    return NextResponse.json({
      ok: true,
      database: "connected",
      host,
      profiles: row.profiles,
      mealPlans: plans.plans,
      openai: Boolean(process.env.OPENAI_API_KEY),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        message: error instanceof Error ? error.message : "unknown",
        openai: Boolean(process.env.OPENAI_API_KEY),
      },
      { status: 500 },
    );
  }
}
