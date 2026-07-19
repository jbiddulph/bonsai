"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { mealPlans, pantryItems, shoppingLists } from "@/db/schema";
import { generateMealPlanWithAI, type GeneratedDay } from "@/lib/ai/meal-plan";
import { attachMealImages } from "@/lib/food-images";
import {
  assertCanGenerateMealPlan,
  getSubscriptionTier,
  incrementMealPlanUsage,
} from "@/lib/billing";
import { getDb } from "@/lib/drizzle";
import { requireOnboardedProfile } from "@/lib/onboarding-gate";

export async function getMealPlanUsage() {
  const { user } = await requireOnboardedProfile();
  const quota = await assertCanGenerateMealPlan(user.id);
  const { isPremium, tier } = await getSubscriptionTier(user.id);
  return { ...quota, isPremium, tier };
}

export async function listMealPlans() {
  const { user } = await requireOnboardedProfile();
  const db = getDb();
  return db
    .select()
    .from(mealPlans)
    .where(eq(mealPlans.userId, user.id))
    .orderBy(desc(mealPlans.createdAt))
    .limit(20);
}

export async function getMealPlan(planId: string) {
  const { user } = await requireOnboardedProfile();
  const db = getDb();
  const [plan] = await db
    .select()
    .from(mealPlans)
    .where(and(eq(mealPlans.id, planId), eq(mealPlans.userId, user.id)))
    .limit(1);
  return plan ?? null;
}

export async function generateWeeklyMealPlan() {
  try {
    const { user, profile } = await requireOnboardedProfile();
    const quota = await assertCanGenerateMealPlan(user.id);
    if (!quota.allowed) {
      return {
        ok: false as const,
        error: `Free plan limit reached (${quota.limit}/month). Upgrade to Premium for unlimited plans.`,
        code: "LIMIT" as const,
      };
    }

    const db = getDb();
    const pantry = await db
      .select({ name: pantryItems.name })
      .from(pantryItems)
      .where(eq(pantryItems.userId, user.id));

    const { plan, provider, warning } = await generateMealPlanWithAI(
      profile,
      pantry.map((p) => p.name),
    );

    const startDate = new Date();
    const [saved] = await db
      .insert(mealPlans)
      .values({
        userId: user.id,
        title: plan.title,
        startDate,
        days: plan.days,
        estimatedCostGbp: String(plan.estimatedCostGbp),
        nutritionSummary: plan.nutritionSummary,
        leftoverStrategy: plan.leftoverStrategy,
        mealPrepGuide: plan.mealPrepGuide,
        inputSnapshot: {
          provider,
          warning: warning ?? null,
          diet: profile.diet,
          goal: profile.goal,
          budgetWeeklyGbp: profile.budgetWeeklyGbp,
        },
      })
      .returning();

    if (!saved?.id) {
      return {
        ok: false as const,
        error: "Plan generated but failed to save. Check DATABASE_URL.",
      };
    }

    await db.insert(shoppingLists).values({
      userId: user.id,
      mealPlanId: saved.id,
      title: `Shop · ${plan.title}`,
      items: plan.shoppingList,
      estimatedSpendGbp: String(plan.estimatedCostGbp),
      supermarket: profile.preferredSupermarket,
    });

    await incrementMealPlanUsage(user.id);
    revalidatePath("/app/plan");
    revalidatePath("/app/groceries");

    return {
      ok: true as const,
      planId: saved.id,
      provider,
      warning,
    };
  } catch (error) {
    console.error("[generateWeeklyMealPlan]", error);
    return {
      ok: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Could not generate a meal plan. Please try again.",
    };
  }
}

export async function regenerateMealInPlan(input: {
  planId: string;
  dayIndex: number;
  slot: "breakfast" | "lunch" | "dinner" | "snack";
}) {
  try {
    const { user, profile } = await requireOnboardedProfile();
    const db = getDb();
    const [plan] = await db
      .select()
      .from(mealPlans)
      .where(and(eq(mealPlans.id, input.planId), eq(mealPlans.userId, user.id)))
      .limit(1);

    if (!plan) {
      return { ok: false as const, error: "Plan not found" };
    }

    const days = (plan.days as GeneratedDay[]) ?? [];
    if (!days[input.dayIndex]) {
      return { ok: false as const, error: "Invalid day" };
    }

    const replacements = [
      "Chickpea pasta primavera",
      "Tofu stir-fry noodles",
      "Smoky bean tacos",
      "Mushroom barley risotto",
      "Peanut satay veg bowl",
    ];
    const pick = replacements[Math.floor(Math.random() * replacements.length)];
    const nextMeal = await attachMealImages({
      name: pick,
      description: `Regenerated ${input.slot} for ${profile.diet} preferences.`,
      prepMinutes: 12,
      cookMinutes: 18,
      ingredients: [
        { item: "seasonal vegetables", amount: "250g" },
        { item: "beans or tofu", amount: "200g" },
        { item: "herbs & spices", amount: "to taste" },
      ],
      instructions: [
        "Prep ingredients.",
        "Cook until tender and aromatic.",
        "Adjust seasoning and serve.",
      ],
      calories: 480,
      proteinG: 24,
      estimatedCostGbp: 2.6,
    });

    const updatedDays = days.map((day, index) => {
      if (index !== input.dayIndex) return day;
      if (input.slot === "snack" && !profile.includeSnacks) {
        return { ...day, snack: null };
      }
      return { ...day, [input.slot]: nextMeal };
    });

    await db
      .update(mealPlans)
      .set({ days: updatedDays })
      .where(eq(mealPlans.id, plan.id));

    revalidatePath(`/app/plan/${plan.id}`);
    revalidatePath("/app/plan");
    return { ok: true as const };
  } catch (error) {
    console.error("[regenerateMealInPlan]", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not swap meal",
    };
  }
}
