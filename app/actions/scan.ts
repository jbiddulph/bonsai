"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { scans } from "@/db/schema";
import { analyzeLabelText, type ScanAnalysis } from "@/lib/ai/scanner";
import {
  assertCanScan,
  getSubscriptionTier,
  incrementScanUsage,
} from "@/lib/billing";
import { getDb } from "@/lib/drizzle";
import { requireOnboardedProfile } from "@/lib/onboarding-gate";

export async function getScanUsage() {
  const { user } = await requireOnboardedProfile();
  const quota = await assertCanScan(user.id);
  const { isPremium, tier } = await getSubscriptionTier(user.id);
  return { ...quota, isPremium, tier };
}

export async function listScans() {
  const { user } = await requireOnboardedProfile();
  const db = getDb();
  return db
    .select()
    .from(scans)
    .where(eq(scans.userId, user.id))
    .orderBy(desc(scans.createdAt))
    .limit(20);
}

export async function analyzeScan(input: { rawText: string; label?: string }) {
  try {
    const { user } = await requireOnboardedProfile();
    const text = input.rawText?.trim() ?? "";
    if (text.length < 8) {
      return {
        ok: false as const,
        error: "Paste at least a short ingredient list or menu line.",
      };
    }

    const quota = await assertCanScan(user.id);
    if (!quota.allowed) {
      return {
        ok: false as const,
        error: `Free scan limit reached (${quota.limit}/month). Upgrade to Premium for unlimited scans.`,
        code: "LIMIT" as const,
      };
    }

    const analysis = await analyzeLabelText(text);
    const db = getDb();
    const [saved] = await db
      .insert(scans)
      .values({
        userId: user.id,
        rawText: text.slice(0, 8000),
        result: {
          ...analysis,
          label: input.label?.trim() || null,
        } satisfies ScanAnalysis & { label: string | null },
        isVegan: analysis.isVegan,
        isVegetarian: analysis.isVegetarian,
        healthScore: analysis.healthScore,
      })
      .returning();

    await incrementScanUsage(user.id);
    revalidatePath("/app/scan");

    return {
      ok: true as const,
      scanId: saved.id,
      analysis,
    };
  } catch (error) {
    console.error("[analyzeScan]", error);
    return {
      ok: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Could not analyse that label. Please try again.",
    };
  }
}
