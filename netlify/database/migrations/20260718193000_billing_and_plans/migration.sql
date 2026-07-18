-- Phase 2/4 support indexes and billing helper columns (idempotent-ish)
CREATE INDEX IF NOT EXISTS meal_plans_user_id_idx ON meal_plans (user_id);
CREATE INDEX IF NOT EXISTS meal_plans_created_at_idx ON meal_plans (created_at DESC);
CREATE INDEX IF NOT EXISTS usage_limits_user_period_idx ON usage_limits (user_id, period_start);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_idx ON subscriptions (stripe_customer_id);
CREATE INDEX IF NOT EXISTS shopping_lists_user_id_idx ON shopping_lists (user_id);
CREATE INDEX IF NOT EXISTS pantry_items_user_id_idx ON pantry_items (user_id);
