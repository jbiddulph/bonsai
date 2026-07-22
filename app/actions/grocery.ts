"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { mealPlans, pantryItems, shoppingLists } from "@/db/schema";
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

export async function deleteShoppingList(listId: string) {
  try {
    const { user } = await requireOnboardedProfile();
    const db = getDb();

    const deleted = await db
      .delete(shoppingLists)
      .where(
        and(eq(shoppingLists.id, listId), eq(shoppingLists.userId, user.id)),
      )
      .returning();

    if (deleted.length === 0) {
      return { ok: false as const, error: "List not found" };
    }

    revalidatePath("/app/groceries");
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not delete list",
    };
  }
}

export async function createShoppingListFromMealPlan(planId: string) {
  try {
    const { user, profile } = await requireOnboardedProfile();
    const db = getDb();

    const [plan] = await db
      .select()
      .from(mealPlans)
      .where(and(eq(mealPlans.id, planId), eq(mealPlans.userId, user.id)))
      .limit(1);

    if (!plan) {
      return { ok: false as const, error: "Meal plan not found" };
    }

    type MealPlanDay = {
      date: string;
      breakfast?: { ingredients?: Array<{ item: string; amount: string }> };
      lunch?: { ingredients?: Array<{ item: string; amount: string }> };
      dinner?: { ingredients?: Array<{ item: string; amount: string }> };
      snack?: { ingredients?: Array<{ item: string; amount: string }> };
    };

    const days = (plan.days as MealPlanDay[]) ?? [];
    const ingredientsMap = new Map<
      string,
      { amount: string; aisle: string; count: number }
    >();

    const aisleMap: Record<string, string> = {
      lettuce: "Produce",
      spinach: "Produce",
      tomato: "Produce",
      onion: "Produce",
      garlic: "Produce",
      pepper: "Produce",
      carrot: "Produce",
      potato: "Produce",
      broccoli: "Produce",
      cucumber: "Produce",
      avocado: "Produce",
      mushroom: "Produce",
      tofu: "Chilled",
      tempeh: "Chilled",
      milk: "Chilled",
      yogurt: "Chilled",
      cheese: "Chilled",
      hummus: "Chilled",
      pasta: "Dry goods",
      rice: "Dry goods",
      quinoa: "Dry goods",
      oats: "Dry goods",
      flour: "Dry goods",
      lentils: "Dry goods",
      beans: "Tins",
      chickpeas: "Tins",
      tomatoes: "Tins",
      bread: "Bakery",
      tortilla: "Bakery",
      pita: "Bakery",
      frozen: "Frozen",
      berries: "Frozen",
    };

    function guessAisle(item: string): string {
      const lower = item.toLowerCase();
      for (const [keyword, aisle] of Object.entries(aisleMap)) {
        if (lower.includes(keyword)) return aisle;
      }
      return "Other";
    }

    days.forEach((day) => {
      [day.breakfast, day.lunch, day.dinner, day.snack].forEach((meal) => {
        if (!meal?.ingredients) return;
        meal.ingredients.forEach((ing) => {
          const key = ing.item.toLowerCase().trim();
          const existing = ingredientsMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            ingredientsMap.set(key, {
              amount: ing.amount,
              aisle: guessAisle(ing.item),
              count: 1,
            });
          }
        });
      });
    });

    const items: ShopItem[] = Array.from(ingredientsMap.entries()).map(
      ([item, data]) => ({
        item,
        amount: data.count > 1 ? `${data.amount} × ${data.count}` : data.amount,
        aisle: data.aisle,
      }),
    );

    const [saved] = await db
      .insert(shoppingLists)
      .values({
        userId: user.id,
        mealPlanId: planId,
        title: `Shop · ${plan.title}`,
        items,
        estimatedSpendGbp: plan.estimatedCostGbp,
        supermarket: profile.preferredSupermarket,
      })
      .returning();

    revalidatePath("/app/groceries");
    return { ok: true as const, listId: saved.id };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Could not generate shopping list",
    };
  }
}
