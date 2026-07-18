import Link from "next/link";
import { getCurrentProfile } from "@/app/actions/profile";
import { ProfileWizard } from "@/components/profile-wizard";
import { profileToForm } from "@/lib/profile-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { user, profile } = await getCurrentProfile();
  const initial = profileToForm(profile, user.name ?? "");
  const params = await searchParams;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sprout">Your preferences</p>
          <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-leaf-deep">
            Profile settings
          </h1>
          <p className="mt-3 max-w-xl text-foreground/70">
            Update diet, budget, equipment, and targets anytime. Meal plans will
            use the latest values.
          </p>
        </div>
        <Link
          href="/app"
          className="text-sm font-medium text-leaf underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
      </div>

      {!profile?.onboardingCompleted && (
        <p className="mb-6 rounded-xl border border-citrus/40 bg-citrus/10 px-4 py-3 text-sm text-soil">
          Finish all steps and save to complete onboarding.
        </p>
      )}

      {params.saved === "1" && (
        <p className="mb-6 rounded-xl border border-sprout/40 bg-sprout/10 px-4 py-3 text-sm text-leaf-deep">
          Preferences saved to your Neon database.
        </p>
      )}

      {profile && (
        <p className="mb-6 text-sm text-foreground/55">
          Stored in <code className="text-foreground/80">public.profiles</code>
          : {profile.displayName ?? "—"} · {profile.diet} · {profile.goal}
          {profile.updatedAt
            ? ` · updated ${new Date(profile.updatedAt).toLocaleString("en-GB")}`
            : ""}
          . Auth account name is separate ({user.name ?? user.email}).
        </p>
      )}

      <ProfileWizard initial={initial} mode="settings" />
    </main>
  );
}
