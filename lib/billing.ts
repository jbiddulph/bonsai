import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "@/lib/drizzle";
import { subscriptions, usageLimits } from "@/db/schema";

export const FREE_MEAL_PLAN_LIMIT = 5;
export const FREE_SCAN_LIMIT = 10;
export const FREE_AI_CHAT_LIMIT = 10;

function periodStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export async function getSubscriptionTier(userId: string) {
  const db = getDb();
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const tier = sub?.tier ?? "free";
  const active =
    tier === "free" ||
    sub?.status === "active" ||
    sub?.status === "trialing";

  return {
    subscription: sub ?? null,
    tier: active ? tier : "free",
    isPremium: active && (tier === "premium" || tier === "family"),
  };
}

export async function getOrCreateUsage(userId: string) {
  const db = getDb();
  const start = periodStart();
  const [existing] = await db
    .select()
    .from(usageLimits)
    .where(
      and(eq(usageLimits.userId, userId), gte(usageLimits.periodStart, start)),
    )
    .orderBy(desc(usageLimits.periodStart))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(usageLimits)
    .values({
      userId,
      periodStart: start,
      mealPlansUsed: 0,
      scansUsed: 0,
      aiChatsUsed: 0,
    })
    .returning();

  return created;
}

export async function assertCanGenerateMealPlan(userId: string) {
  const { isPremium } = await getSubscriptionTier(userId);
  if (isPremium) {
    return { allowed: true as const, remaining: Infinity, used: 0, limit: Infinity };
  }

  const usage = await getOrCreateUsage(userId);
  const remaining = FREE_MEAL_PLAN_LIMIT - usage.mealPlansUsed;
  if (remaining <= 0) {
    return {
      allowed: false as const,
      remaining: 0,
      used: usage.mealPlansUsed,
      limit: FREE_MEAL_PLAN_LIMIT,
    };
  }

  return {
    allowed: true as const,
    remaining,
    used: usage.mealPlansUsed,
    limit: FREE_MEAL_PLAN_LIMIT,
  };
}

export async function incrementMealPlanUsage(userId: string) {
  const { isPremium } = await getSubscriptionTier(userId);
  if (isPremium) return;

  const usage = await getOrCreateUsage(userId);
  const db = getDb();
  await db
    .update(usageLimits)
    .set({ mealPlansUsed: usage.mealPlansUsed + 1 })
    .where(eq(usageLimits.id, usage.id));
}

export async function assertCanScan(userId: string) {
  const { isPremium } = await getSubscriptionTier(userId);
  if (isPremium) {
    return { allowed: true as const, remaining: Infinity, used: 0, limit: Infinity };
  }

  const usage = await getOrCreateUsage(userId);
  const remaining = FREE_SCAN_LIMIT - usage.scansUsed;
  if (remaining <= 0) {
    return {
      allowed: false as const,
      remaining: 0,
      used: usage.scansUsed,
      limit: FREE_SCAN_LIMIT,
    };
  }

  return {
    allowed: true as const,
    remaining,
    used: usage.scansUsed,
    limit: FREE_SCAN_LIMIT,
  };
}

export async function incrementScanUsage(userId: string) {
  const { isPremium } = await getSubscriptionTier(userId);
  if (isPremium) return;

  const usage = await getOrCreateUsage(userId);
  const db = getDb();
  await db
    .update(usageLimits)
    .set({ scansUsed: usage.scansUsed + 1 })
    .where(eq(usageLimits.id, usage.id));
}
