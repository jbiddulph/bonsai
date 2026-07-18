import Link from "next/link";
import { eq } from "drizzle-orm";
import { pantryItems } from "@/db/schema";
import { getDb } from "@/lib/drizzle";
import { requireOnboardedProfile } from "@/lib/onboarding-gate";

export const dynamic = "force-dynamic";

export default async function PantryPage() {
  const { user } = await requireOnboardedProfile();
  const db = getDb();
  const items = await db
    .select()
    .from(pantryItems)
    .where(eq(pantryItems.userId, user.id));

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 md:px-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-leaf-deep">
        Pantry & Leftovers
      </h1>
      <p className="mt-3 text-foreground/70">
        Staples from onboarding show up here. Leftover AI comes in Phase 8.
      </p>

      {items.length === 0 ? (
        <p className="mt-8 rounded-xl border border-leaf/10 bg-mist px-4 py-6 text-sm text-foreground/65">
          No pantry items yet.{" "}
          <Link href="/app/settings" className="font-medium text-leaf underline">
            Add staples in profile settings
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-leaf/10 rounded-xl border border-leaf/10 bg-mist">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <span className="font-medium text-leaf-deep">{item.name}</span>
              <span className="text-foreground/50">
                {[item.quantity, item.unit].filter(Boolean).join(" ") ||
                  item.category ||
                  "staple"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/app"
        className="mt-8 inline-flex text-sm font-medium text-leaf underline-offset-4 hover:underline"
      >
        Back to home
      </Link>
    </main>
  );
}
