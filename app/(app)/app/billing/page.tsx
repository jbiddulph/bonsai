import { BillingActions } from "@/components/billing-actions";
import { getSubscriptionTier } from "@/lib/billing";
import { requireOnboardedProfile } from "@/lib/onboarding-gate";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { user } = await requireOnboardedProfile();
  const { tier, isPremium, subscription } = await getSubscriptionTier(user.id);
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <p className="text-sm font-medium text-sprout">Subscription</p>
      <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-leaf-deep">
        Billing
      </h1>
      <p className="mt-3 text-foreground/70">
        Free: 5 meal plans / month. Premium unlocks unlimited plans, scanner,
        pantry AI, and priority generation.
      </p>

      {params.checkout === "success" && (
        <p className="mt-4 rounded-xl border border-sprout/40 bg-sprout/10 px-4 py-3 text-sm text-leaf-deep">
          Checkout complete — if Premium isn&apos;t showing yet, wait a moment
          for the webhook.
        </p>
      )}
      {params.checkout === "cancel" && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Checkout cancelled.
        </p>
      )}

      <div className="mt-8 rounded-2xl border border-leaf/10 bg-mist p-5">
        <p className="text-sm text-foreground/60">Current plan</p>
        <p className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl font-semibold capitalize text-leaf-deep">
          {tier}
          {isPremium ? " · active" : ""}
        </p>
        {subscription?.currentPeriodEnd && (
          <p className="mt-2 text-sm text-foreground/55">
            Renews / ends{" "}
            {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB")}
          </p>
        )}
      </div>

      <div className="mt-8">
        <BillingActions />
      </div>

      {!process.env.STRIPE_SECRET_KEY && (
        <p className="mt-6 text-sm text-amber-800">
          Stripe keys are not configured yet. Add STRIPE_SECRET_KEY and price
          IDs in Netlify env to enable checkout.
        </p>
      )}
    </main>
  );
}
