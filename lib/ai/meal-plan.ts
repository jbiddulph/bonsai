import type { Profile } from "@/db/schema";
import { enrichMealsWithImages, foodImageForMeal } from "@/lib/food-images";

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

type DayTemplate = {
  day: string;
  breakfast: Parameters<typeof meal>;
  lunch: Parameters<typeof meal>;
  dinner: Parameters<typeof meal>;
  snack: Parameters<typeof meal>;
};

function buildMockWeek(profile: Profile): DayTemplate[] {
  const diet = profile.diet.replaceAll("_", "-");
  return [
    {
      day: "Monday",
      breakfast: [
        "Berry overnight oats",
        {
          description: "Oats soaked with plant milk, berries, and chia.",
          calories: 380,
          proteinG: 18,
          estimatedCostGbp: 1.2,
          prepMinutes: 5,
          cookMinutes: 0,
          ingredients: [
            { item: "rolled oats", amount: "60g" },
            { item: "plant milk", amount: "200ml" },
            { item: "mixed berries", amount: "80g" },
            { item: "chia seeds", amount: "1 tbsp" },
          ],
        },
      ],
      lunch: [
        `${diet} rainbow buddha bowl`,
        {
          description: "Grain bowl with roasted veg, hummus, and greens.",
          calories: 520,
          proteinG: 24,
          estimatedCostGbp: 2.8,
          ingredients: [
            { item: "cooked quinoa", amount: "150g" },
            { item: "roasted chickpeas", amount: "100g" },
            { item: "hummus", amount: "3 tbsp" },
            { item: "salad leaves", amount: "2 handfuls" },
          ],
        },
      ],
      dinner: [
        "Lentil coconut curry",
        {
          description: "Red lentils simmered in coconut and spices.",
          calories: 610,
          proteinG: 32,
          cookMinutes: 30,
          estimatedCostGbp: 3.1,
          ingredients: [
            { item: "red lentils", amount: "120g" },
            { item: "coconut milk", amount: "200ml" },
            { item: "spinach", amount: "100g" },
            { item: "curry paste", amount: "1 tbsp" },
          ],
        },
      ],
      snack: [
        "Apple + peanut butter",
        {
          calories: 220,
          proteinG: 8,
          prepMinutes: 2,
          cookMinutes: 0,
          estimatedCostGbp: 0.9,
          ingredients: [
            { item: "apple", amount: "1" },
            { item: "peanut butter", amount: "1 tbsp" },
          ],
        },
      ],
    },
    {
      day: "Tuesday",
      breakfast: [
        "Tofu scramble on toast",
        {
          description: "Turmeric tofu with tomatoes on wholegrain toast.",
          calories: 420,
          proteinG: 26,
          estimatedCostGbp: 1.6,
          ingredients: [
            { item: "firm tofu", amount: "150g" },
            { item: "cherry tomatoes", amount: "80g" },
            { item: "wholegrain bread", amount: "2 slices" },
          ],
        },
      ],
      lunch: [
        "Chickpea pasta primavera",
        {
          description: "High-protein pasta with seasonal vegetables.",
          calories: 540,
          proteinG: 30,
          estimatedCostGbp: 2.5,
          ingredients: [
            { item: "chickpea pasta", amount: "75g dry" },
            { item: "courgette", amount: "1" },
            { item: "peas", amount: "80g" },
            { item: "garlic", amount: "2 cloves" },
          ],
        },
      ],
      dinner: [
        "Smoky bean tacos",
        {
          description: "Soft tacos with spiced beans, salsa, and avocado.",
          calories: 580,
          proteinG: 26,
          estimatedCostGbp: 2.9,
          ingredients: [
            { item: "black beans", amount: "1 tin" },
            { item: "corn tortillas", amount: "3" },
            { item: "avocado", amount: "½" },
            { item: "salsa", amount: "3 tbsp" },
          ],
        },
      ],
      snack: [
        "Hummus + carrot sticks",
        {
          calories: 180,
          proteinG: 7,
          prepMinutes: 3,
          cookMinutes: 0,
          estimatedCostGbp: 0.8,
          ingredients: [
            { item: "hummus", amount: "3 tbsp" },
            { item: "carrots", amount: "2" },
          ],
        },
      ],
    },
    {
      day: "Wednesday",
      breakfast: [
        "Peanut banana smoothie bowl",
        {
          description: "Frozen banana blended with peanut butter and oats.",
          calories: 400,
          proteinG: 16,
          estimatedCostGbp: 1.4,
          cookMinutes: 0,
          ingredients: [
            { item: "banana", amount: "1" },
            { item: "peanut butter", amount: "1 tbsp" },
            { item: "oats", amount: "30g" },
            { item: "plant milk", amount: "150ml" },
          ],
        },
      ],
      lunch: [
        "Curry leftover wraps",
        {
          description: "Monday’s curry tucked into wraps with salad.",
          calories: 500,
          proteinG: 22,
          estimatedCostGbp: 1.8,
          cookMinutes: 5,
          ingredients: [
            { item: "leftover curry", amount: "200g" },
            { item: "wholewheat wraps", amount: "2" },
            { item: "salad leaves", amount: "1 handful" },
          ],
        },
      ],
      dinner: [
        "Miso aubergine rice bowl",
        {
          description: "Roasted aubergine with miso glaze over rice.",
          calories: 560,
          proteinG: 18,
          estimatedCostGbp: 2.7,
          ingredients: [
            { item: "aubergine", amount: "1" },
            { item: "miso paste", amount: "1 tbsp" },
            { item: "brown rice", amount: "150g cooked" },
            { item: "edamame", amount: "80g" },
          ],
        },
      ],
      snack: [
        "Roasted chickpeas",
        {
          calories: 200,
          proteinG: 10,
          prepMinutes: 5,
          cookMinutes: 20,
          estimatedCostGbp: 0.7,
          ingredients: [
            { item: "chickpeas", amount: "100g" },
            { item: "smoked paprika", amount: "½ tsp" },
          ],
        },
      ],
    },
    {
      day: "Thursday",
      breakfast: [
        "Avocado toast with seeds",
        {
          description: "Smashed avocado, lemon, and mixed seeds on toast.",
          calories: 390,
          proteinG: 12,
          estimatedCostGbp: 1.5,
          cookMinutes: 5,
          ingredients: [
            { item: "avocado", amount: "½" },
            { item: "wholegrain bread", amount: "2 slices" },
            { item: "mixed seeds", amount: "1 tbsp" },
          ],
        },
      ],
      lunch: [
        "Tomato lentil soup + bread",
        {
          description: "Hearty red lentil tomato soup with crusty bread.",
          calories: 480,
          proteinG: 24,
          estimatedCostGbp: 2.0,
          ingredients: [
            { item: "red lentils", amount: "80g" },
            { item: "tinned tomatoes", amount: "200g" },
            { item: "vegetable stock", amount: "400ml" },
            { item: "sourdough", amount: "1 slice" },
          ],
        },
      ],
      dinner: [
        "Peanut satay veg noodles",
        {
          description: "Stir-fried veg and noodles in peanut satay sauce.",
          calories: 620,
          proteinG: 28,
          estimatedCostGbp: 3.0,
          ingredients: [
            { item: "rice noodles", amount: "80g dry" },
            { item: "mixed stir-fry veg", amount: "250g" },
            { item: "peanut butter", amount: "2 tbsp" },
            { item: "tofu", amount: "150g" },
          ],
        },
      ],
      snack: [
        "Orange + almonds",
        {
          calories: 210,
          proteinG: 6,
          prepMinutes: 1,
          cookMinutes: 0,
          estimatedCostGbp: 0.9,
          ingredients: [
            { item: "orange", amount: "1" },
            { item: "almonds", amount: "20g" },
          ],
        },
      ],
    },
    {
      day: "Friday",
      breakfast: [
        "Chia pudding with mango",
        {
          description: "Chia soaked overnight, topped with mango.",
          calories: 360,
          proteinG: 12,
          estimatedCostGbp: 1.5,
          prepMinutes: 5,
          cookMinutes: 0,
          ingredients: [
            { item: "chia seeds", amount: "3 tbsp" },
            { item: "plant milk", amount: "200ml" },
            { item: "mango", amount: "80g" },
          ],
        },
      ],
      lunch: [
        "Falafel salad plate",
        {
          description: "Baked falafel with cucumber tomato salad and tahini.",
          calories: 530,
          proteinG: 22,
          estimatedCostGbp: 2.6,
          ingredients: [
            { item: "falafel", amount: "4 pieces" },
            { item: "cucumber", amount: "½" },
            { item: "tomatoes", amount: "2" },
            { item: "tahini", amount: "1 tbsp" },
          ],
        },
      ],
      dinner: [
        "Mushroom barley risotto",
        {
          description: "Creamy pearl barley with mushrooms and thyme.",
          calories: 590,
          proteinG: 20,
          cookMinutes: 35,
          estimatedCostGbp: 2.8,
          ingredients: [
            { item: "pearl barley", amount: "80g" },
            { item: "mushrooms", amount: "200g" },
            { item: "onion", amount: "1" },
            { item: "vegetable stock", amount: "500ml" },
          ],
        },
      ],
      snack: [
        "Banana oat cookies",
        {
          calories: 230,
          proteinG: 6,
          prepMinutes: 10,
          cookMinutes: 15,
          estimatedCostGbp: 0.6,
          ingredients: [
            { item: "banana", amount: "1" },
            { item: "oats", amount: "60g" },
            { item: "raisins", amount: "20g" },
          ],
        },
      ],
    },
    {
      day: "Saturday",
      breakfast: [
        "Pancakes with berries",
        {
          description: "Fluffy plant-based pancakes and fresh berries.",
          calories: 450,
          proteinG: 14,
          estimatedCostGbp: 1.8,
          ingredients: [
            { item: "plain flour", amount: "80g" },
            { item: "plant milk", amount: "120ml" },
            { item: "berries", amount: "100g" },
            { item: "maple syrup", amount: "1 tbsp" },
          ],
        },
      ],
      lunch: [
        "Mediterranean mezze plate",
        {
          description: "Hummus, olives, pitta, and chopped salad.",
          calories: 510,
          proteinG: 16,
          estimatedCostGbp: 2.4,
          cookMinutes: 10,
          ingredients: [
            { item: "hummus", amount: "4 tbsp" },
            { item: "pitta", amount: "1" },
            { item: "olives", amount: "40g" },
            { item: "cucumber & tomato", amount: "150g" },
          ],
        },
      ],
      dinner: [
        "Sweet potato black bean chilli",
        {
          description: "One-pot chilli with sweet potato and beans.",
          calories: 640,
          proteinG: 28,
          cookMinutes: 35,
          estimatedCostGbp: 3.2,
          ingredients: [
            { item: "sweet potato", amount: "1 medium" },
            { item: "black beans", amount: "1 tin" },
            { item: "tinned tomatoes", amount: "400g" },
            { item: "chilli powder", amount: "1 tsp" },
          ],
        },
      ],
      snack: [
        "Trail mix handful",
        {
          calories: 240,
          proteinG: 7,
          prepMinutes: 1,
          cookMinutes: 0,
          estimatedCostGbp: 1.0,
          ingredients: [
            { item: "mixed nuts", amount: "25g" },
            { item: "dried fruit", amount: "20g" },
          ],
        },
      ],
    },
    {
      day: "Sunday",
      breakfast: [
        "Shakshuka-style beans",
        {
          description: "Spiced tomato beans with herbs and toast.",
          calories: 430,
          proteinG: 18,
          estimatedCostGbp: 1.7,
          ingredients: [
            { item: "cannellini beans", amount: "1 tin" },
            { item: "tinned tomatoes", amount: "200g" },
            { item: "pepper", amount: "1" },
            { item: "toast", amount: "2 slices" },
          ],
        },
      ],
      lunch: [
        "Leftover chilli baked potato",
        {
          description: "Jacket potato topped with Saturday’s chilli.",
          calories: 550,
          proteinG: 20,
          estimatedCostGbp: 1.5,
          cookMinutes: 45,
          ingredients: [
            { item: "baking potato", amount: "1 large" },
            { item: "leftover chilli", amount: "200g" },
            { item: "spring onions", amount: "2" },
          ],
        },
      ],
      dinner: [
        "Herb roasted veg traybake",
        {
          description: "Sheet-pan veg with chickpeas and lemon tahini.",
          calories: 570,
          proteinG: 22,
          cookMinutes: 40,
          estimatedCostGbp: 2.9,
          ingredients: [
            { item: "mixed roasting veg", amount: "400g" },
            { item: "chickpeas", amount: "1 tin" },
            { item: "tahini", amount: "1 tbsp" },
            { item: "lemon", amount: "½" },
          ],
        },
      ],
      snack: [
        "Dark chocolate + pear",
        {
          calories: 200,
          proteinG: 3,
          prepMinutes: 1,
          cookMinutes: 0,
          estimatedCostGbp: 0.9,
          ingredients: [
            { item: "pear", amount: "1" },
            { item: "dark chocolate", amount: "20g" },
          ],
        },
      ],
    },
  ];
}

export function mockMealPlan(profile: Profile): GeneratedMealPlan {
  const days = buildMockWeek(profile).map((d) => ({
    day: d.day,
    breakfast: meal(...d.breakfast),
    lunch: meal(...d.lunch),
    dinner: meal(...d.dinner),
    snack: profile.includeSnacks ? meal(...d.snack) : null,
  }));

  return {
    title: `Week for ${profile.displayName ?? "you"}`,
    days,
    shoppingList: [
      { item: "Oats", amount: "750g", aisle: "Dry goods" },
      { item: "Red lentils", amount: "500g", aisle: "Dry goods" },
      { item: "Chickpeas / beans", amount: "4 tins", aisle: "Tins" },
      { item: "Tofu", amount: "2 packs", aisle: "Chilled" },
      { item: "Coconut milk", amount: "1 tin", aisle: "Tins" },
      { item: "Mixed veg", amount: "1.5kg", aisle: "Produce" },
      { item: "Fruit (apples, bananas, berries)", amount: "assortment", aisle: "Produce" },
      { item: "Peanut butter", amount: "1 jar", aisle: "Spreads" },
      { item: "Wholegrain bread / wraps", amount: "1 pack each", aisle: "Bakery" },
      { item: "Pasta / noodles / rice", amount: "assorted", aisle: "Dry goods" },
    ],
    estimatedCostGbp: Number(profile.budgetWeeklyGbp ?? 35) || 35,
    nutritionSummary: {
      avgDailyCalories: profile.calorieTarget ?? 1730,
      avgDailyProteinG: profile.proteinTargetG ?? 86,
    },
    leftoverStrategy:
      "Batch Monday’s curry for Wednesday wraps, and Saturday’s chilli for Sunday jacket potatoes.",
    mealPrepGuide:
      "Cook a pot of grains + lentils once. Chop salad veg twice weekly. Keep sauces (tahini, satay, hummus) ready in jars.",
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

async function enrichPlanImages(
  plan: GeneratedMealPlan,
): Promise<GeneratedMealPlan> {
  const flat: GeneratedMeal[] = [];
  for (const day of plan.days) {
    flat.push(day.breakfast, day.lunch, day.dinner);
    if (day.snack) flat.push(day.snack);
  }
  const enriched = await enrichMealsWithImages(flat);
  let i = 0;
  const days = plan.days.map((day) => {
    const breakfast = enriched[i++]!;
    const lunch = enriched[i++]!;
    const dinner = enriched[i++]!;
    const snack = day.snack ? enriched[i++]! : null;
    return { ...day, breakfast, lunch, dinner, snack };
  });
  return { ...plan, days };
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
    const plan = await enrichPlanImages(mockMealPlan(profile));
    return {
      plan,
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
      plan: await enrichPlanImages(normalizePlan(parsed, profile)),
      provider: "openai",
    };
  } catch (error) {
    console.error("[meal-plan] OpenAI failed, using mock:", error);
    return {
      plan: await enrichPlanImages(mockMealPlan(profile)),
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
