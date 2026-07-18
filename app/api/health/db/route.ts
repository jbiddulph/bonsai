import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { describeDatabaseTarget, getDatabaseUrl } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Lightweight check that production can reach Postgres. No secrets returned. */
export async function GET() {
  const url = getDatabaseUrl();
  const target = describeDatabaseTarget(url);

  if (!url) {
    return NextResponse.json(
      {
        ok: false,
        database: "missing",
        hint: "Set a non-empty DATABASE_URL (Neon pooled string) on Netlify and redeploy",
        openai: Boolean(process.env.OPENAI_API_KEY),
      },
      { status: 500 },
    );
  }

  try {
    const sql = neon(url);
    const [row] = await sql`select count(*)::int as profiles from profiles`;
    const [plans] = await sql`select count(*)::int as plans from meal_plans`;
    const latest = await sql`
      select display_name, diet, goal, updated_at
      from profiles
      order by updated_at desc nulls last
      limit 1
    `;
    return NextResponse.json({
      ok: true,
      database: "connected",
      ...target,
      note: target.isNetlifyDatabase
        ? "Writing to Netlify Database — open that DB in Netlify, not your other Neon project"
        : "Writing to your Neon DATABASE_URL — check public.profiles in that project",
      profiles: row.profiles,
      mealPlans: plans.plans,
      latestProfile: latest[0] ?? null,
      openai: Boolean(process.env.OPENAI_API_KEY),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        ...target,
        message: error instanceof Error ? error.message : "unknown",
        openai: Boolean(process.env.OPENAI_API_KEY),
      },
      { status: 500 },
    );
  }
}
