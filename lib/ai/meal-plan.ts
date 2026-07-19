import type { Profile } from "@/db/schema";
import { foodImageForMeal } from "@/lib/food-images";

export type GeneratedMeal = {
  name: string;
  description: string;
  prepMinutes: number;
  cookMinutes: number;
  ingredients: { item: string; amount: string }[];
  instructions: string[];
  calories: number;
  proteinG: number;
  estimatedCostGbp: number;
  imageUrl?: string;
  imageAlt?: string;
};

export type GeneratedDay = {
  day: string;
  breakfast: GeneratedMeal;
  lunch: GeneratedMeal;
  dinner: GeneratedMeal;
  snack: GeneratedMeal | null;
};

export type GeneratedMealPlan = {
  title: string;
  days: GeneratedDay[];
  shoppingList: { item: string; amount: string; aisle: string }[];
  estimatedCostGbp: number;
  nutritionSummary: {
    avgDailyCalories: number;
    avgDailyProteinG: number;
  };
  leftoverStrategy: string;
  mealPrepGuide: string;
};

const MEAL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "description",
    "prepMinutes",
    "cookMinutes",
    "ingredients",
    "instructions",
    "calories",
    "proteinG",
    "estimatedCostGbp",
  ],
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    prepMinutes: { type: "number" },
    cookMinutes: { type: "number" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["item", "amount"],
        properties: {
          item: { type: "string" },
          amount: { type: "string" },
        },
      },
    },
    instructions: { type: "array", items: { type: "string" } },
    calories: { type: "number" },
    proteinG: { type: "number" },
    estimatedCostGbp: { type: "number" },
  },
} as const;

/** OpenAI strict mode: avoid anyOf/null — use includeSnack + optional snack meal. */
export const mealPlanJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "days",
    "shoppingList",
    "estimatedCostGbp",
    "nutritionSummary",
    "leftoverStrategy",
    "mealPrepGuide",
  ],
  properties: {
    title: { type: "string" },
    days: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "breakfast", "lunch", "dinner", "includeSnack", "snack"],
        properties: {
          day: { type: "string" },
          breakfast: MEAL_SCHEMA,
          lunch: MEAL_SCHEMA,
          dinner: MEAL_SCHEMA,
          includeSnack: { type: "boolean" },
          snack: MEAL_SCHEMA,
        },
      },
    },
    shoppingList: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["item", "amount", "aisle"],
        properties: {
          item: { type: "string" },
          amount: { type: "string" },
          aisle: { type: "string" },
        },
      },
    },
    estimatedCostGbp: { type: "number" },
    nutritionSummary: {
      type: "object",
      additionalProperties: false,
      required: ["avgDailyCalories", "avgDailyProteinG"],
      properties: {
        avgDailyCalories: { type: "number" },
        avgDailyProteinG: { type: "number" },
      },
    },
    leftoverStrategy: { type: "string" },
    mealPrepGuide: { type: "string" },
  },
} as const;

function withFoodImage(meal: GeneratedMeal): GeneratedMeal {
  if (meal.imageUrl) return meal;
  const image = foodImageForMeal(
    meal.name,
    [
      meal.description,
      ...(meal.ingredients ?? []).slice(0, 3).map((i) => i.item),
    ].filter(Boolean),
  );
  return { ...meal, imageUrl: image.url, imageAlt: image.alt };
}

function meal(
  name: string,
  extras?: Partial<GeneratedMeal>,
): GeneratedMeal {
  return withFoodImage({
    name,
    description: `Simple ${name.toLowerCase()} using pantry staples.`,
    prepMinutes: 10,
    cookMinutes: 20,
    ingredients: [
      { item: "mixed vegetables", amount: "200g" },
      { item: "plant protein", amount: "150g" },
      { item: "olive oil", amount: "1 tbsp" },
    ],
    instructions: [
      "Prep ingredients.",
      "Cook on medium heat until ready.",
      "Season and serve.",
    ],
    calories: 450,
    proteinG: 22,
    estimatedCostGbp: 2.4,
    ...extras,
  });
}

export function mockMealPlan(profile: Profile): GeneratedMealPlan {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ].map((day, index) => ({
    day,
    breakfast: meal(`Overnight oats #${index + 1}`, {
      calories: 380,
      proteinG: 18,
      estimatedCostGbp: 1.2,
    }),
    lunch: meal(`${profile.diet.replaceAll("_", "-")} buddha bowl`, {
      calories: 520,
      proteinG: 28,
      estimatedCostGbp: 2.8,
    }),
    dinner: meal("Lentil coconut curry", {
      calories: 610,
      proteinG: 32,
      cookMinutes: 30,
      estimatedCostGbp: 3.1,
    }),
    snack: profile.includeSnacks
      ? meal("Apple + peanut butter", {
          calories: 220,
          proteinG: 8,
          prepMinutes: 2,
          cookMinutes: 0,
          estimatedCostGbp: 0.9,
        })
      : null,
  }));

  return {
    title: `Week for ${profile.displayName ?? "you"}`,
    days,
    shoppingList: [
      { item: "Oats", amount: "750g", aisle: "Dry goods" },
      { item: "Red lentils", amount: "500g", aisle: "Dry goods" },
      { item: "Tofu", amount: "2 packs", aisle: "Chilled" },
      { item: "Coconut milk", amount: "2 tins", aisle: "Tins" },
      { item: "Mixed veg", amount: "1kg", aisle: "Produce" },
      { item: "Apples", amount: "7", aisle: "Produce" },
      { item: "Peanut butter", amount: "1 jar", aisle: "Spreads" },
    ],
    estimatedCostGbp: Number(profile.budgetWeeklyGbp ?? 35) || 35,
    nutritionSummary: {
      avgDailyCalories: profile.calorieTarget ?? 1730,
      avgDailyProteinG: profile.proteinTargetG ?? 86,
    },
    leftoverStrategy:
      "Batch the curry on Sunday; use leftovers for Wednesday lunch wraps with salad.",
    mealPrepGuide:
      "Cook a pot of grains + lentils once. Chop veg twice weekly. Keep sauces separate.",
  };
}

export function buildMealPlanPrompt(
  profile: Profile,
  pantryNames: string[],
): string {
  return [
    "Create a compact 7-day plant-based meal plan as JSON matching the schema.",
    "Keep ingredient lists short (3–6 items) and instructions to 3 steps max.",
    "Optimise for nutrition, budget, variety, time, leftovers, and UK ingredients.",
    `Diet: ${profile.diet}`,
    `Goal: ${profile.goal}`,
    `Household size: ${profile.householdSize}`,
    `Include snacks: ${profile.includeSnacks}`,
    `Cooking skill: ${profile.cookingSkill}`,
    `Max cook time: ${profile.cookingTimeMinutes} minutes`,
    `Weekly budget GBP: ${profile.budgetWeeklyGbp ?? "flexible"}`,
    `Preferred supermarket: ${profile.preferredSupermarket ?? "any"}`,
    `Allergies: ${(profile.allergies ?? []).join(", ") || "none"}`,
    `Dislikes: ${(profile.dislikes ?? []).join(", ") || "none"}`,
    `Equipment: ${(profile.kitchenEquipment ?? []).join(", ") || "basic"}`,
    `Calorie target: ${profile.calorieTarget ?? "auto"}`,
    `Protein target g: ${profile.proteinTargetG ?? "auto"}`,
    `Pantry first: ${pantryNames.join(", ") || "none listed"}`,
    "For each day set includeSnack true/false. Always provide a snack object; if includeSnack is false it will be ignored.",
  ].join("\n");
}

type OpenAiDay = GeneratedDay & {
  includeSnack?: boolean;
  snack: GeneratedMeal;
};

function normalizePlan(
  raw: Omit<GeneratedMealPlan, "days"> & { days: OpenAiDay[] },
  profile: Profile,
): GeneratedMealPlan {
  const days = (raw.days ?? []).slice(0, 7).map((day) => ({
    day: day.day,
    breakfast: withFoodImage(day.breakfast),
    lunch: withFoodImage(day.lunch),
    dinner: withFoodImage(day.dinner),
    snack:
      profile.includeSnacks && day.includeSnack !== false && day.snack
        ? withFoodImage(day.snack)
        : null,
  }));

  while (days.length < 7) {
    const mockDay = mockMealPlan(profile).days[days.length];
    days.push(mockDay);
  }

  return {
    title: raw.title || `Week for ${profile.displayName ?? "you"}`,
    days,
    shoppingList: raw.shoppingList?.length
      ? raw.shoppingList
      : mockMealPlan(profile).shoppingList,
    estimatedCostGbp: Number(raw.estimatedCostGbp) || 35,
    nutritionSummary: raw.nutritionSummary ?? {
      avgDailyCalories: 1800,
      avgDailyProteinG: 80,
    },
    leftoverStrategy:
      raw.leftoverStrategy || mockMealPlan(profile).leftoverStrategy,
    mealPrepGuide: raw.mealPrepGuide || mockMealPlan(profile).mealPrepGuide,
  };
}

/**
 * Netlify serverless requests die (~10s) before a full weekly JSON plan finishes.
 * Default: mock on Netlify. Opt in with OPENAI_MEAL_PLAN_SYNC=1 (still aborted quickly).
 */
function shouldCallOpenAISync(): boolean {
  if (!process.env.OPENAI_API_KEY) return false;
  if (process.env.OPENAI_MEAL_PLAN_SYNC === "0") return false;
  if (process.env.OPENAI_MEAL_PLAN_SYNC === "1") return true;
  // Auto: skip sync AI on Netlify — cold start + auth + DB leave almost no budget.
  if (process.env.NETLIFY === "true") return false;
  return true;
}

const OPENAI_BUDGET_MS = Number(process.env.OPENAI_MEAL_PLAN_TIMEOUT_MS ?? 4_000);

export async function generateMealPlanWithAI(
  profile: Profile,
  pantryNames: string[],
): Promise<{ plan: GeneratedMealPlan; provider: "openai" | "mock"; warning?: string }> {
  if (!shouldCallOpenAISync()) {
    const onNetlify = process.env.NETLIFY === "true";
    return {
      plan: mockMealPlan(profile),
      provider: "mock",
      warning: onNetlify
        ? "Live AI is skipped on Netlify (request time limit). Showing a personalized demo plan — set OPENAI_MEAL_PLAN_SYNC=1 to try AI with a short timeout."
        : undefined,
    };
  }

  const apiKey = process.env.OPENAI_API_KEY!;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_BUDGET_MS);

  try {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({
      apiKey,
      timeout: OPENAI_BUDGET_MS,
      maxRetries: 0,
    });

    const response = await client.responses.create(
      {
        model: process.env.OPENAI_MEAL_PLAN_MODEL ?? "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are BonsAI, an expert plant-based meal planner for UK households. Be concise.",
          },
          {
            role: "user",
            content: buildMealPlanPrompt(profile, pantryNames),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "meal_plan",
            strict: true,
            schema: mealPlanJsonSchema,
          },
        },
      },
      { signal: controller.signal },
    );

    const text = response.output_text;
    if (!text) {
      throw new Error("OpenAI returned an empty meal plan");
    }

    const parsed = JSON.parse(text) as Omit<GeneratedMealPlan, "days"> & {
      days: OpenAiDay[];
    };
    return {
      plan: normalizePlan(parsed, profile),
      provider: "openai",
    };
  } catch (error) {
    console.error("[meal-plan] OpenAI failed, using mock:", error);
    return {
      plan: mockMealPlan(profile),
      provider: "mock",
      warning:
        error instanceof Error
          ? `AI unavailable (${error.message}). Showing a demo plan instead.`
          : "AI unavailable. Showing a demo plan instead.",
    };
  } finally {
    clearTimeout(timer);
  }
}
