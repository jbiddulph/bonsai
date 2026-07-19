"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { pantryItems, shoppingLists } from "@/db/schema";
import { getDb } from "@/lib/drizzle";
import { requireOnboardedProfile } from "@/lib/onboarding-gate";

export type ShopItem = {
  item: string;
  amount: string;
  aisle: string;
  checked?: boolean;
};

export async function getGroceryContext() {
  const { user, profile } = await requireOnboardedProfile();
  const db = getDb();
  const [lists, pantry] = await Promise.all([
    db
      .select()
      .from(shoppingLists)
      .where(eq(shoppingLists.userId, user.id))
      .orderBy(desc(shoppingLists.createdAt))
      .limit(10),
    db
      .select({ name: pantryItems.name })
      .from(pantryItems)
      .where(eq(pantryItems.userId, user.id)),
  ]);

  return {
    lists,
    pantryNames: pantry.map((p) => p.name),
    supermarket: profile.preferredSupermarket,
    budgetWeeklyGbp: profile.budgetWeeklyGbp,
    householdSize: profile.householdSize,
  };
}

export async function addGroceryItem(input: {
  listId: string;
  item: string;
  amount?: string;
  aisle?: string;
}) {
  try {
    const { user } = await requireOnboardedProfile();
    const name = input.item.trim();
    if (!name) {
      return { ok: false as const, error: "Item name required" };
    }

    const db = getDb();
    const [list] = await db
      .select()
      .from(shoppingLists)
      .where(
        and(eq(shoppingLists.id, input.listId), eq(shoppingLists.userId, user.id)),
      )
      .limit(1);

    if (!list) return { ok: false as const, error: "List not found" };

    const items = [...((list.items as ShopItem[]) ?? [])];
    items.push({
      item: name,
      amount: input.amount?.trim() || "1",
      aisle: input.aisle?.trim() || "Other",
    });

    await db
      .update(shoppingLists)
      .set({ items })
      .where(eq(shoppingLists.id, list.id));

    revalidatePath("/app/groceries");
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not add item",
    };
  }
}

export async function removeGroceryItem(input: {
  listId: string;
  itemKey: string;
}) {
  try {
    const { user } = await requireOnboardedProfile();
    const db = getDb();
    const [list] = await db
      .select()
      .from(shoppingLists)
      .where(
        and(eq(shoppingLists.id, input.listId), eq(shoppingLists.userId, user.id)),
      )
      .limit(1);

    if (!list) return { ok: false as const, error: "List not found" };

    const items = ((list.items as ShopItem[]) ?? []).filter(
      (item, index) => `${item.item}-${item.amount}-${index}` !== input.itemKey,
    );

    await db
      .update(shoppingLists)
      .set({ items })
      .where(eq(shoppingLists.id, list.id));

    revalidatePath("/app/groceries");
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not remove item",
    };
  }
}

export async function createBlankShoppingList() {
  try {
    const { user, profile } = await requireOnboardedProfile();
    const db = getDb();
    const [saved] = await db
      .insert(shoppingLists)
      .values({
        userId: user.id,
        title: `Shop · ${new Date().toLocaleDateString("en-GB")}`,
        items: [],
        estimatedSpendGbp: profile.budgetWeeklyGbp
          ? String(profile.budgetWeeklyGbp)
          : null,
        supermarket: profile.preferredSupermarket,
      })
      .returning();

    revalidatePath("/app/groceries");
    return { ok: true as const, listId: saved.id };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not create list",
    };
  }
}
