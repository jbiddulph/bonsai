import Link from "next/link";
import {
  Leaf,
  ScanLine,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { requireOnboardedProfile } from "@/lib/onboarding-gate";

export const dynamic = "force-dynamic";

const modules = [
  {
    href: "/app/plan",
    title: "AI Meal Planner",
    blurb: "7-day plant-based plans in under 30 seconds.",
    icon: UtensilsCrossed,
    status: "Ready",
  },
  {
    href: "/app/scan",
    title: "AI Scanner",
    blurb: "Check labels and menus for hidden animal ingredients.",
    icon: ScanLine,
    status: "Ready",
  },
  {
    href: "/app/groceries",
    title: "Grocery Planner",
    blurb: "Budget-aware lists from your weekly plan.",
    icon: ShoppingBasket,
    status: "Ready",
  },
  {
    href: "/app/pantry",
    title: "Pantry & Leftovers",
    blurb: "Cook what you already have. Waste less.",
    icon: Leaf,
    status: "Ready",
  },
];

export default async function AppHomePage() {
  const { user, profile } = await requireOnboardedProfile();
  const name =
    profile.displayName?.split(" ")[0] ??
    user.name?.split(" ")[0] ??
    "there";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
      <div className="mb-10">
        <p className="text-sm font-medium text-sprout">Grow Smarter. Eat Better.</p>
        <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-leaf-deep">
          Welcome back, {name}
        </h1>
        <p className="mt-3 max-w-xl text-foreground/70">
          {profile.diet.replace("_", "-")} · {profile.householdSize}{" "}
          {profile.householdSize === 1 ? "person" : "people"}
          {profile.budgetWeeklyGbp
            ? ` · £${profile.budgetWeeklyGbp}/week`
            : ""}
          . Start with a meal plan — everything else helps you stick to it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/app/plan"
            className="inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-mist transition hover:bg-leaf-deep"
          >
            <Sparkles className="size-4" />
            Generate this week&apos;s plan
          </Link>
          <Link
            href="/app/settings"
            className="inline-flex items-center rounded-full border border-leaf/20 px-5 py-2.5 text-sm font-medium text-leaf-deep transition hover:bg-leaf/5"
          >
            Edit preferences
          </Link>
          <SignOutButton />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group rounded-2xl border border-leaf/10 bg-mist p-5 transition hover:border-sprout/40 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <mod.icon className="size-5 text-leaf" />
              <span className="text-xs font-medium text-foreground/45">
                {mod.status}
              </span>
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-xl font-semibold text-leaf-deep group-hover:text-leaf">
              {mod.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/65">
              {mod.blurb}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
