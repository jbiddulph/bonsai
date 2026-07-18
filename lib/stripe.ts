import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(key, {
    apiVersion: "2026-06-24.dahlia",
  });
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.URL ??
    process.env.DEPLOY_PRIME_URL ??
    "http://localhost:3000"
  );
}

export function getStripePriceIds() {
  return {
    premiumMonthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    premiumYearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
    familyMonthly: process.env.STRIPE_PRICE_FAMILY_MONTHLY,
  };
}
