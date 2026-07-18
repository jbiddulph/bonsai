"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/drizzle";
import { pantryItems, profiles } from "@/db/schema";
import type { ProfileFormData } from "@/lib/profile-options";

async function requireUser() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }
  return session.user;
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

function parseDislikes(dislikes: string): string[] {
  return dislikes
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toProfileValues(data: ProfileFormData, onboardingCompleted: boolean) {
  return {
    displayName: data.displayName.trim() || null,
    diet: data.diet,
    goal: data.goal,
    allergies: data.allergies,
    dislikes: parseDislikes(data.dislikes),
    budgetWeeklyGbp: data.budgetWeeklyGbp.trim() || null,
    cookingSkill: data.cookingSkill,
    cookingTimeMinutes: data.cookingTimeMinutes,
    householdSize: Math.max(1, data.householdSize),
    mealsPerDay: Math.min(6, Math.max(1, data.mealsPerDay)),
    includeSnacks: data.includeSnacks,
    calorieTarget: parseOptionalInt(data.calorieTarget),
    proteinTargetG: parseOptionalInt(data.proteinTargetG),
    preferredSupermarket: data.preferredSupermarket || null,
    kitchenEquipment: data.kitchenEquipment,
    onboardingCompleted,
    updatedAt: new Date(),
  };
}

export async function getCurrentProfile() {
  const user = await requireUser();
  const db = getDb();
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);

  return { user, profile: profile ?? null };
}

export async function saveProfile(
  data: ProfileFormData,
  options?: { completeOnboarding?: boolean; replacePantryBasics?: boolean },
) {
  const user = await requireUser();
  const db = getDb();
  const complete = options?.completeOnboarding ?? false;
  const values = toProfileValues(data, complete);

  const [existing] = await db
    .select({
      id: profiles.id,
      onboardingCompleted: profiles.onboardingCompleted,
    })
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);

  if (existing) {
    await db
      .update(profiles)
      .set({
        ...values,
        onboardingCompleted: complete || existing.onboardingCompleted,
      })
      .where(eq(profiles.userId, user.id));
  } else {
    await db.insert(profiles).values({
      userId: user.id,
      ...values,
      onboardingCompleted: complete,
    });
  }

  if (options?.replacePantryBasics && data.pantryBasics.length > 0) {
    const existingItems = await db
      .select({ name: pantryItems.name })
      .from(pantryItems)
      .where(eq(pantryItems.userId, user.id));

    const existingNames = new Set(
      existingItems.map((i) => i.name.toLowerCase()),
    );

    const toInsert = data.pantryBasics
      .filter((name) => !existingNames.has(name.toLowerCase()))
      .map((name) => ({
        userId: user.id,
        name,
        category: "staple",
        quantity: "1",
      }));

    if (toInsert.length > 0) {
      await db.insert(pantryItems).values(toInsert);
    }
  }

  revalidatePath("/app");
  revalidatePath("/app/settings");
  revalidatePath("/app/onboarding");
  revalidatePath("/app/pantry");

  return { ok: true as const };
}
