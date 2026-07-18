import type { Profile } from "@/db/schema";

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
      minItems: 7,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "breakfast", "lunch", "dinner", "snack"],
        properties: {
          day: { type: "string" },
          breakfast: MEAL_SCHEMA,
          lunch: MEAL_SCHEMA,
          dinner: MEAL_SCHEMA,
          snack: {
            anyOf: [MEAL_SCHEMA, { type: "null" }],
          },
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

function meal(
  name: string,
  extras?: Partial<GeneratedMeal>,
): GeneratedMeal {
  return {
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
  };
}

/** Deterministic plan used when OPENAI_API_KEY is missing (local/demo). */
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
    lunch: meal(`${profile.diet} buddha bowl`, {
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
    estimatedCostGbp: Number(profile.budgetWeeklyGbp ?? 35),
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
    "Create a 7-day plant-based meal plan as JSON matching the schema.",
    "Optimise for nutrition, budget, variety, time, leftovers, and seasonal UK ingredients.",
    `Diet: ${profile.diet}`,
    `Goal: ${profile.goal}`,
    `Household size: ${profile.householdSize}`,
    `Meals/day: ${profile.mealsPerDay}`,
    `Snacks: ${profile.includeSnacks}`,
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
    "Use pantry items where sensible. Keep estimatedCostGbp realistic for UK prices.",
    "If snacks are disabled, set snack to null each day.",
  ].join("\n");
}

export async function generateMealPlanWithAI(
  profile: Profile,
  pantryNames: string[],
): Promise<{ plan: GeneratedMealPlan; provider: "openai" | "mock" }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { plan: mockMealPlan(profile), provider: "mock" };
  }

  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model: process.env.OPENAI_MEAL_PLAN_MODEL ?? "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "You are BonsAI, an expert plant-based meal planner for UK households.",
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
  });

  const text = response.output_text;
  if (!text) {
    throw new Error("OpenAI returned an empty meal plan");
  }

  const plan = JSON.parse(text) as GeneratedMealPlan;
  return { plan, provider: "openai" };
}
