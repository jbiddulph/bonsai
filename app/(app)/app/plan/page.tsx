import Link from "next/link";
import { requireOnboardedProfile } from "@/lib/onboarding-gate";

export const dynamic = "force-dynamic";

export default async function PlanPlaceholderPage() {
  await requireOnboardedProfile();

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 md:px-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-leaf-deep">
        AI Meal Planner
      </h1>
      <p className="mt-3 text-foreground/70">
        Phase 4 will generate personalized 7-day plans from your profile —
        goals, diet, budget, time, and pantry.
      </p>
      <Link
        href="/app"
        className="mt-8 inline-flex text-sm font-medium text-leaf underline-offset-4 hover:underline"
      >
        Back to home
      </Link>
    </main>
  );
}
