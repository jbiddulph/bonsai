import Link from "next/link";
import { notFound } from "next/navigation";
import { getMealPlan } from "@/app/actions/meal-plan";
import { MealFoodImage } from "@/components/meal-food-image";
import { RegenerateMealButton } from "@/components/regenerate-meal-button";
import type { GeneratedDay, GeneratedMeal } from "@/lib/ai/meal-plan";
import { requireOnboardedProfile } from "@/lib/onboarding-gate";

export const dynamic = "force-dynamic";

function MealCard({
  label,
  meal,
  planId,
  dayIndex,
  slot,
}: {
  label: string;
  meal: GeneratedMeal | null;
  planId: string;
  dayIndex: number;
  slot: "breakfast" | "lunch" | "dinner" | "snack";
}) {
  if (!meal) return null;
  const ingredients = meal.ingredients ?? [];
  const instructions = meal.instructions ?? [];
  const prep = Number(meal.prepMinutes) || 0;
  const cook = Number(meal.cookMinutes) || 0;

  return (
    <div className="overflow-hidden rounded-xl border border-leaf/10 bg-white/60">
      <div className="grid gap-0 sm:grid-cols-[140px_1fr]">
        <MealFoodImage
          mealName={meal.name}
          imageUrl={meal.imageUrl}
          imageAlt={meal.imageAlt}
          className="aspect-[4/3] sm:aspect-auto sm:min-h-full"
        />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-sprout uppercase">
                {label}
              </p>
              <h3 className="mt-1 font-medium text-leaf-deep">{meal.name}</h3>
            </div>
            <RegenerateMealButton
              planId={planId}
              dayIndex={dayIndex}
              slot={slot}
            />
          </div>
          <p className="mt-2 text-sm text-foreground/65">{meal.description}</p>
          <p className="mt-3 text-xs text-foreground/50">
            {prep + cook} min · {meal.calories ?? "—"} kcal ·{" "}
            {meal.proteinG ?? "—"}g protein · £{meal.estimatedCostGbp ?? "—"}
          </p>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium text-leaf">
              Ingredients & method
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground/70">
              {ingredients.map((ing, i) => (
                <li key={`${ing.item}-${ing.amount}-${i}`}>
                  {ing.amount} {ing.item}
                </li>
              ))}
            </ul>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-foreground/70">
              {instructions.map((step, i) => (
                <li key={`${i}-${step.slice(0, 24)}`}>{step}</li>
              ))}
            </ol>
          </details>
        </div>
      </div>
    </div>
  );
}

export default async function MealPlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  await requireOnboardedProfile();
  const { planId } = await params;
  const plan = await getMealPlan(planId);
  if (!plan) notFound();

  const days = (plan.days as GeneratedDay[]) ?? [];
  const nutrition = (plan.nutritionSummary ?? {}) as {
    avgDailyCalories?: number;
    avgDailyProteinG?: number;
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
      <Link
        href="/app/plan"
        className="text-sm font-medium text-leaf underline-offset-4 hover:underline"
      >
        ← All plans
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-leaf-deep">
        {plan.title}
      </h1>
      <p className="mt-3 text-foreground/70">
        ~£{plan.estimatedCostGbp} estimated · avg{" "}
        {nutrition.avgDailyCalories ?? "—"} kcal ·{" "}
        {nutrition.avgDailyProteinG ?? "—"}g protein
      </p>

      <div className="mt-6 grid gap-3 rounded-2xl border border-leaf/10 bg-mist p-4 text-sm text-foreground/75 md:grid-cols-2">
        <div>
          <p className="font-semibold text-leaf-deep">Meal prep</p>
          <p className="mt-1">{plan.mealPrepGuide}</p>
        </div>
        <div>
          <p className="font-semibold text-leaf-deep">Leftovers</p>
          <p className="mt-1">{plan.leftoverStrategy}</p>
        </div>
      </div>

      <div className="mt-10 space-y-8">
        {days.map((day, dayIndex) => (
          <section key={day.day} className="space-y-3">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-leaf-deep">
              {day.day}
            </h2>
            <div className="grid gap-3">
              <MealCard
                label="Breakfast"
                meal={day.breakfast}
                planId={plan.id}
                dayIndex={dayIndex}
                slot="breakfast"
              />
              <MealCard
                label="Lunch"
                meal={day.lunch}
                planId={plan.id}
                dayIndex={dayIndex}
                slot="lunch"
              />
              <MealCard
                label="Dinner"
                meal={day.dinner}
                planId={plan.id}
                dayIndex={dayIndex}
                slot="dinner"
              />
              <MealCard
                label="Snack"
                meal={day.snack}
                planId={plan.id}
                dayIndex={dayIndex}
                slot="snack"
              />
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10">
        <Link
          href="/app/groceries"
          className="inline-flex rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-mist hover:bg-leaf-deep"
        >
          View shopping list
        </Link>
      </div>
    </main>
  );
}
