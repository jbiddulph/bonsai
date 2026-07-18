-- BonsAI foundation schema (Phase 1)
CREATE TYPE "public"."diet_type" AS ENUM('vegan', 'vegetarian', 'plant_based');
CREATE TYPE "public"."goal_type" AS ENUM('weight_loss', 'muscle_gain', 'maintenance');
CREATE TYPE "public"."plan_tier" AS ENUM('free', 'premium', 'family');

CREATE TABLE IF NOT EXISTS "profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE,
  "display_name" text,
  "diet" "diet_type" DEFAULT 'plant_based' NOT NULL,
  "goal" "goal_type" DEFAULT 'maintenance' NOT NULL,
  "allergies" text[] DEFAULT '{}' NOT NULL,
  "dislikes" text[] DEFAULT '{}' NOT NULL,
  "budget_weekly_gbp" numeric(10, 2),
  "cooking_skill" text DEFAULT 'beginner',
  "cooking_time_minutes" integer DEFAULT 30,
  "household_size" integer DEFAULT 1 NOT NULL,
  "meals_per_day" integer DEFAULT 3 NOT NULL,
  "include_snacks" boolean DEFAULT true NOT NULL,
  "calorie_target" integer,
  "protein_target_g" integer,
  "preferred_supermarket" text,
  "kitchen_equipment" text[] DEFAULT '{}' NOT NULL,
  "onboarding_completed" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE,
  "tier" "plan_tier" DEFAULT 'free' NOT NULL,
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "status" text DEFAULT 'inactive' NOT NULL,
  "current_period_end" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "usage_limits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "period_start" timestamp with time zone NOT NULL,
  "meal_plans_used" integer DEFAULT 0 NOT NULL,
  "scans_used" integer DEFAULT 0 NOT NULL,
  "ai_chats_used" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "recipes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "title" text NOT NULL,
  "description" text,
  "diet_tags" text[] DEFAULT '{}' NOT NULL,
  "ingredients" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "instructions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "nutrition" jsonb DEFAULT '{}'::jsonb,
  "estimated_cost_gbp" numeric(10, 2),
  "prep_minutes" integer,
  "cook_minutes" integer,
  "servings" integer DEFAULT 2,
  "source" text DEFAULT 'ai',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "meal_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text NOT NULL,
  "start_date" timestamp with time zone NOT NULL,
  "days" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "estimated_cost_gbp" numeric(10, 2),
  "nutrition_summary" jsonb DEFAULT '{}'::jsonb,
  "leftover_strategy" text,
  "meal_prep_guide" text,
  "input_snapshot" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pantry_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "quantity" text,
  "unit" text,
  "category" text,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "shopping_lists" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "meal_plan_id" uuid,
  "title" text NOT NULL,
  "items" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "estimated_spend_gbp" numeric(10, 2),
  "supermarket" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "scans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "image_url" text,
  "raw_text" text,
  "result" jsonb DEFAULT '{}'::jsonb,
  "is_vegan" boolean,
  "is_vegetarian" boolean,
  "health_score" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "favorites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "recipe_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Drop Netlify Database demo table if present
DROP TABLE IF EXISTS "planets";
