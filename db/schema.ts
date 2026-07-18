import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const dietTypeEnum = pgEnum("diet_type", [
  "vegan",
  "vegetarian",
  "plant_based",
]);

export const goalTypeEnum = pgEnum("goal_type", [
  "weight_loss",
  "muscle_gain",
  "maintenance",
]);

export const planTierEnum = pgEnum("plan_tier", ["free", "premium", "family"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  displayName: text("display_name"),
  diet: dietTypeEnum("diet").default("plant_based").notNull(),
  goal: goalTypeEnum("goal").default("maintenance").notNull(),
  allergies: text("allergies").array().default([]).notNull(),
  dislikes: text("dislikes").array().default([]).notNull(),
  budgetWeeklyGbp: numeric("budget_weekly_gbp", { precision: 10, scale: 2 }),
  cookingSkill: text("cooking_skill").default("beginner"),
  cookingTimeMinutes: integer("cooking_time_minutes").default(30),
  householdSize: integer("household_size").default(1).notNull(),
  mealsPerDay: integer("meals_per_day").default(3).notNull(),
  includeSnacks: boolean("include_snacks").default(true).notNull(),
  calorieTarget: integer("calorie_target"),
  proteinTargetG: integer("protein_target_g"),
  preferredSupermarket: text("preferred_supermarket"),
  kitchenEquipment: text("kitchen_equipment").array().default([]).notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  tier: planTierEnum("tier").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").default("inactive").notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usageLimits = pgTable("usage_limits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  mealPlansUsed: integer("meal_plans_used").default(0).notNull(),
  scansUsed: integer("scans_used").default(0).notNull(),
  aiChatsUsed: integer("ai_chats_used").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const recipes = pgTable("recipes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  title: text("title").notNull(),
  description: text("description"),
  dietTags: text("diet_tags").array().default([]).notNull(),
  ingredients: jsonb("ingredients").notNull().default([]),
  instructions: jsonb("instructions").notNull().default([]),
  nutrition: jsonb("nutrition").default({}),
  estimatedCostGbp: numeric("estimated_cost_gbp", { precision: 10, scale: 2 }),
  prepMinutes: integer("prep_minutes"),
  cookMinutes: integer("cook_minutes"),
  servings: integer("servings").default(2),
  source: text("source").default("ai"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mealPlans = pgTable("meal_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  days: jsonb("days").notNull().default([]),
  estimatedCostGbp: numeric("estimated_cost_gbp", { precision: 10, scale: 2 }),
  nutritionSummary: jsonb("nutrition_summary").default({}),
  leftoverStrategy: text("leftover_strategy"),
  mealPrepGuide: text("meal_prep_guide"),
  inputSnapshot: jsonb("input_snapshot").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pantryItems = pgTable("pantry_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  quantity: text("quantity"),
  unit: text("unit"),
  category: text("category"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const shoppingLists = pgTable("shopping_lists", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  mealPlanId: uuid("meal_plan_id"),
  title: text("title").notNull(),
  items: jsonb("items").notNull().default([]),
  estimatedSpendGbp: numeric("estimated_spend_gbp", { precision: 10, scale: 2 }),
  supermarket: text("supermarket"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scans = pgTable("scans", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  imageUrl: text("image_url"),
  rawText: text("raw_text"),
  result: jsonb("result").default({}),
  isVegan: boolean("is_vegan"),
  isVegetarian: boolean("is_vegetarian"),
  healthScore: integer("health_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const favorites = pgTable("favorites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  recipeId: uuid("recipe_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type MealPlan = typeof mealPlans.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type PantryItem = typeof pantryItems.$inferSelect;
