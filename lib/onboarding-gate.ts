import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/app/actions/profile";

export async function requireOnboardedProfile() {
  const result = await getCurrentProfile();
  if (!result.profile?.onboardingCompleted) {
    redirect("/app/onboarding");
  }
  return result;
}
