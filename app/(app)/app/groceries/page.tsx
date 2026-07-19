import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getGroceryContext, type ShopItem } from "@/app/actions/grocery";
import { CreateGroceryListButton } from "@/components/create-grocery-list-button";
import { GroceryListCard } from "@/components/grocery-list-card";
import { requireOnboardedProfile } from "@/lib/onboarding-gate";

export const dynamic = "force-dynamic";

export default async function GroceriesPage() {
  await requireOnboardedProfile();
  const { lists, pantryNames, supermarket, budgetWeeklyGbp, householdSize } =
    await getGroceryContext();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
      <Link
        href="/app"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-leaf underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to app
      </Link>

      <p className="text-sm font-medium text-sprout">Module 4</p>
      <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-leaf-deep">
        Grocery Planner
      </h1>
      <p className="mt-3 max-w-xl text-foreground/70">
        Interactive lists from your meal plans — grouped by aisle, pantry-aware,
        and easy to tick off in the shop.
      </p>

      <div className="mt-6 grid gap-3 rounded-2xl border border-leaf/10 bg-mist p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-sprout uppercase">
            Preferred shop
          </p>
          <p className="mt-1 font-medium text-leaf-deep">
            {supermarket ?? "Any supermarket"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-sprout uppercase">
            Weekly budget
          </p>
          <p className="mt-1 font-medium text-leaf-deep">
            {budgetWeeklyGbp ? `£${budgetWeeklyGbp}` : "Flexible"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-sprout uppercase">
            Household
          </p>
          <p className="mt-1 font-medium text-leaf-deep">
            {householdSize} {householdSize === 1 ? "person" : "people"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/app/plan"
          className="inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-mist transition hover:bg-leaf-deep"
        >
          <Sparkles className="size-4" />
          Generate plan + list
        </Link>
        <CreateGroceryListButton />
        <Link
          href="/app/pantry"
          className="inline-flex items-center rounded-full border border-leaf/20 px-4 py-2 text-sm font-medium text-leaf-deep hover:bg-leaf/5"
        >
          View pantry
        </Link>
      </div>

      {lists.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-leaf/10 bg-mist px-5 py-8 text-sm text-foreground/65">
          No shopping lists yet.{" "}
          <Link href="/app/plan" className="font-medium text-leaf underline">
            Generate a meal plan
          </Link>{" "}
          to build one automatically, or create a blank list above.
        </p>
      ) : (
        <div className="mt-10 space-y-8">
          {lists.map((list) => (
            <GroceryListCard
              key={list.id}
              listId={list.id}
              title={list.title}
              supermarket={list.supermarket}
              estimatedSpendGbp={
                list.estimatedSpendGbp
                  ? String(list.estimatedSpendGbp)
                  : null
              }
              items={(list.items as ShopItem[]) ?? []}
              pantryNames={pantryNames}
            />
          ))}
        </div>
      )}
    </main>
  );
}
