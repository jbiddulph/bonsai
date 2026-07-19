import { NextResponse } from "next/server";
import { generateWeeklyMealPlan } from "@/app/actions/meal-plan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Hint for hosts that honor it; Netlify still has a hard gateway cap. */
export const maxDuration = 26;

/**
 * JSON generate endpoint — avoids Next server-action 504 HTML pages
 * that surface as "An unexpected response was received from the server."
 */
export async function POST() {
  try {
    const result = await generateWeeklyMealPlan();
    const status = result.ok ? 200 : result.code === "LIMIT" ? 402 : 400;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("[api/plans/generate]", error);
    return NextResponse.json(
      {
        ok: false as const,
        error:
          error instanceof Error
            ? error.message
            : "Could not generate a meal plan. Please try again.",
      },
      { status: 500 },
    );
  }
}
