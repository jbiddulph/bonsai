import Link from "next/link";
import { GeneratePlanButton } from "@/components/generate-plan-button";
import { ProduceStrip } from "@/components/meal-food-image";
import { getMealPlanUsage, listMealPlans } from "@/app/actions/meal-plan";
import { produceGalleryImages } from "@/lib/food-images";
import { requireOnboardedProfile } from "@/lib/onboarding-gate";

export const dynamic = "force-dynamic";

export default async function PlanIndexPage() {
  await requireOnboardedProfile();
  const usage = await getMealPlanUsage();
  const plans = await listMealPlans();
  const produce = produceGalleryImages();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
      <p className="text-sm font-medium text-sprout">Core product</p>
      <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-leaf-deep">
        AI Meal Planner
      </h1>
      <p className="mt-3 max-w-xl text-foreground/70">
        Personalized 7-day plans from your profile — nutrition, budget, pantry,
        leftovers.{" "}
        {!process.env.OPENAI_API_KEY ? (
          <span className="text-amber-800">
            Demo mode (no OPENAI_API_KEY) — generates a realistic mock plan.
          </span>
        ) : process.env.NETLIFY === "true" &&
          process.env.OPENAI_MEAL_PLAN_SYNC !== "1" ? (
          <span className="text-amber-800">
            Netlify demo plans (fast). Live AI needs a background job or
            OPENAI_MEAL_PLAN_SYNC=1.
          </span>
        ) : null}
      </p>

      <div className="mt-6">
        <ProduceStrip images={produce} />
        <p className="mt-2 text-right text-[10px] text-foreground/40">
          Photos via{" "}
          <a
            href="https://unsplash.com/?utm_source=bonsai&utm_medium=referral"
            className="underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Unsplash
          </a>
        </p>
      </div>

      <div className="mt-8">
        <GeneratePlanButton
          remaining={
            usage.remaining === Infinity ? 999 : Number(usage.remaining)
          }
          used={usage.used}
          limit={usage.limit === Infinity ? 999 : Number(usage.limit)}
          isPremium={usage.isPremium}
        />
      </div>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-leaf-deep">
          Your plans
        </h2>
        {plans.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/60">
            No plans yet — generate your first week above.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-leaf/10 rounded-2xl border border-leaf/10 bg-mist">
            {plans.map((plan) => (
              <li key={plan.id}>
                <Link
                  href={`/app/plan/${plan.id}`}
                  className="flex items-center justify-between px-4 py-4 transition hover:bg-leaf/5"
                >
                  <div>
                    <p className="font-medium text-leaf-deep">{plan.title}</p>
                    <p className="text-sm text-foreground/55">
                      {plan.createdAt
                        ? new Date(plan.createdAt).toLocaleDateString("en-GB")
                        : ""}
                      {plan.estimatedCostGbp
                        ? ` · ~£${plan.estimatedCostGbp}`
                        : ""}
                    </p>
                  </div>
                  <span className="text-sm text-leaf">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
