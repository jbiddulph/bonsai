import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { shoppingLists } from "@/db/schema";
import { getDb } from "@/lib/drizzle";
import { requireOnboardedProfile } from "@/lib/onboarding-gate";

export const dynamic = "force-dynamic";

type ShopItem = { item: string; amount: string; aisle: string };

export default async function GroceriesPage() {
  const { user } = await requireOnboardedProfile();
  const db = getDb();
  const lists = await db
    .select()
    .from(shoppingLists)
    .where(eq(shoppingLists.userId, user.id))
    .orderBy(desc(shoppingLists.createdAt))
    .limit(10);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-leaf-deep">
        Grocery Planner
      </h1>
      <p className="mt-3 text-foreground/70">
        Lists are generated with each meal plan. Live supermarket pricing comes
        later.
      </p>

      {lists.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/60">
          No lists yet.{" "}
          <Link href="/app/plan" className="font-medium text-leaf underline">
            Generate a meal plan
          </Link>{" "}
          first.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {lists.map((list) => {
            const items = (list.items as ShopItem[]) ?? [];
            const byAisle = items.reduce<Record<string, ShopItem[]>>(
              (acc, item) => {
                const aisle = item.aisle || "Other";
                acc[aisle] = acc[aisle] ? [...acc[aisle], item] : [item];
                return acc;
              },
              {},
            );

            return (
              <section
                key={list.id}
                className="rounded-2xl border border-leaf/10 bg-mist p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-leaf-deep">
                    {list.title}
                  </h2>
                  <p className="text-sm text-foreground/55">
                    {list.supermarket ?? "Any shop"}
                    {list.estimatedSpendGbp
                      ? ` · ~£${list.estimatedSpendGbp}`
                      : ""}
                  </p>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {Object.entries(byAisle).map(([aisle, aisleItems]) => (
                    <div key={aisle}>
                      <p className="text-xs font-semibold tracking-wide text-sprout uppercase">
                        {aisle}
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-foreground/75">
                        {aisleItems.map((item) => (
                          <li key={`${item.item}-${item.amount}`}>
                            <label className="flex items-start gap-2">
                              <input type="checkbox" className="mt-1 accent-leaf" />
                              <span>
                                {item.amount} {item.item}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
