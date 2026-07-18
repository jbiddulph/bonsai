import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profile";
import { ProfileWizard } from "@/components/profile-wizard";
import { profileToForm } from "@/lib/profile-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { user, profile } = await getCurrentProfile();

  if (profile?.onboardingCompleted) {
    redirect("/app/settings");
  }

  const initial = profileToForm(profile, user.name ?? "");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
      <p className="text-sm font-medium text-sprout">Welcome to BonsAI</p>
      <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-leaf-deep">
        Set up your plate
      </h1>
      <p className="mt-3 mb-10 max-w-xl text-foreground/70">
        Two minutes now means better meal plans forever — diet, budget, kitchen,
        and pantry basics.
      </p>
      <ProfileWizard initial={initial} mode="onboarding" />
    </main>
  );
}
