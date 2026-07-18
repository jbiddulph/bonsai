import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { subscriptions } from "@/db/schema";
import { getDb } from "@/lib/drizzle";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function tierFromMetadata(plan?: string | null): "premium" | "family" | "free" {
  if (plan?.startsWith("family")) return "family";
  if (plan?.startsWith("premium")) return "premium";
  return "premium";
}

async function upsertFromSubscription(
  subscription: Stripe.Subscription,
  userId: string,
) {
  const db = getDb();
  const plan = subscription.metadata?.plan;
  const tier = tierFromMetadata(plan);
  const status = subscription.status;
  const active = status === "active" || status === "trialing";
  const periodEndSec =
    // Stripe API shapes vary slightly by version
    (subscription as { current_period_end?: number }).current_period_end ??
    subscription.items.data[0]?.current_period_end;
  const periodEnd = periodEndSec ? new Date(periodEndSec * 1000) : null;

  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const values = {
    tier: active ? tier : "free",
    status,
    stripeCustomerId: String(subscription.customer),
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: periodEnd,
    updatedAt: new Date(),
  } as const;

  if (existing) {
    await db
      .update(subscriptions)
      .set(values)
      .where(eq(subscriptions.userId, userId));
  } else {
    await db.insert(subscriptions).values({
      userId,
      ...values,
    });
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: `Invalid signature: ${error instanceof Error ? error.message : "unknown"}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.metadata?.userId ?? session.client_reference_id ?? undefined;
        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            String(session.subscription),
          );
          await upsertFromSubscription(subscription, userId);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (userId) {
          await upsertFromSubscription(subscription, userId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (userId) {
          const db = getDb();
          await db
            .update(subscriptions)
            .set({
              tier: "free",
              status: "canceled",
              stripeSubscriptionId: subscription.id,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.userId, userId));
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[stripe webhook]", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
