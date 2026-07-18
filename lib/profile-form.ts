import type { Profile } from "@/db/schema";
import {
  defaultProfileForm,
  type DietType,
  type GoalType,
  type ProfileFormData,
} from "@/lib/profile-options";

export function profileToForm(
  profile: Profile | null,
  fallbackName = "",
): ProfileFormData {
  if (!profile) {
    return defaultProfileForm(fallbackName);
  }

  return {
    displayName: profile.displayName ?? fallbackName,
    diet: profile.diet as DietType,
    goal: profile.goal as GoalType,
    allergies: profile.allergies ?? [],
    dislikes: (profile.dislikes ?? []).join(", "),
    budgetWeeklyGbp: profile.budgetWeeklyGbp?.toString() ?? "",
    cookingSkill: profile.cookingSkill ?? "beginner",
    cookingTimeMinutes: profile.cookingTimeMinutes ?? 30,
    householdSize: profile.householdSize ?? 1,
    mealsPerDay: profile.mealsPerDay ?? 3,
    includeSnacks: profile.includeSnacks ?? true,
    calorieTarget: profile.calorieTarget?.toString() ?? "",
    proteinTargetG: profile.proteinTargetG?.toString() ?? "",
    preferredSupermarket: profile.preferredSupermarket ?? "Tesco",
    kitchenEquipment: profile.kitchenEquipment ?? [],
    pantryBasics: [],
  };
}
