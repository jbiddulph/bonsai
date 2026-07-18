"use server";

import { eq } from "drizzle-orm";
import { subscriptions } from "@/db/schema";
import { getDb } from "@/lib/drizzle";
import { requireOnboardedProfile } from "@/lib/onboarding-gate";
import { getAppUrl, getStripe, getStripePriceIds } from "@/lib/stripe";

export async function createCheckoutSession(plan: "premium_monthly" | "premium_yearly" | "family_monthly") {
  const { user } = await requireOnboardedProfile();
  const prices = getStripePriceIds();
  const priceId =
    plan === "premium_monthly"
      ? prices.premiumMonthly
      : plan === "premium_yearly"
        ? prices.premiumYearly
        : prices.familyMonthly;

  if (!priceId) {
    return {
      ok: false as const,
      error:
        "Stripe price IDs are not configured. Set STRIPE_PRICE_PREMIUM_MONTHLY / YEARLY / FAMILY_MONTHLY.",
    };
  }

  const stripe = getStripe();
  const db = getDb();
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  let customerId = existing?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    if (existing) {
      await db
        .update(subscriptions)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(subscriptions.userId, user.id));
    } else {
      await db.insert(subscriptions).values({
        userId: user.id,
        stripeCustomerId: customerId,
        tier: "free",
        status: "inactive",
      });
    }
  }

  const appUrl = getAppUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/app/billing?checkout=success`,
    cancel_url: `${appUrl}/app/billing?checkout=cancel`,
    client_reference_id: user.id,
    metadata: { userId: user.id, plan },
    subscription_data: {
      metadata: { userId: user.id, plan },
      trial_period_days: 7,
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return { ok: false as const, error: "Stripe did not return a checkout URL" };
  }

  return { ok: true as const, url: session.url };
}

export async function createBillingPortalSession() {
  const { user } = await requireOnboardedProfile();
  const db = getDb();
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  if (!sub?.stripeCustomerId) {
    return {
      ok: false as const,
      error: "No Stripe customer yet. Start a subscription first.",
    };
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${getAppUrl()}/app/billing`,
  });

  return { ok: true as const, url: portal.url };
}
