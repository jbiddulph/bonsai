export const DIET_OPTIONS = [
  { value: "vegan", label: "Vegan" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "plant_based", label: "Plant-based" },
] as const;

export const GOAL_OPTIONS = [
  { value: "weight_loss", label: "Weight loss" },
  { value: "muscle_gain", label: "Muscle gain" },
  { value: "maintenance", label: "Maintenance" },
] as const;

export const SKILL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

export const TIME_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60+ min" },
] as const;

export const ALLERGY_OPTIONS = [
  "Nuts",
  "Peanuts",
  "Gluten",
  "Soy",
  "Sesame",
  "Sulphites",
] as const;

export const EQUIPMENT_OPTIONS = [
  "Oven",
  "Hob / stove",
  "Microwave",
  "Air fryer",
  "Blender",
  "Slow cooker",
  "Instant Pot",
  "Grill",
] as const;

export const SUPERMARKET_OPTIONS = [
  "Tesco",
  "Sainsbury's",
  "Asda",
  "Morrisons",
  "Aldi",
  "Lidl",
  "Ocado",
  "Amazon Fresh",
] as const;

export const PANTRY_STAPLES = [
  "Rice",
  "Pasta",
  "Beans / lentils",
  "Oats",
  "Tinned tomatoes",
  "Olive oil",
  "Garlic",
  "Onions",
  "Spices",
  "Plant milk",
  "Tofu",
  "Frozen veg",
] as const;

export type DietType = (typeof DIET_OPTIONS)[number]["value"];
export type GoalType = (typeof GOAL_OPTIONS)[number]["value"];

export type ProfileFormData = {
  displayName: string;
  diet: DietType;
  goal: GoalType;
  allergies: string[];
  dislikes: string;
  budgetWeeklyGbp: string;
  cookingSkill: string;
  cookingTimeMinutes: number;
  householdSize: number;
  mealsPerDay: number;
  includeSnacks: boolean;
  calorieTarget: string;
  proteinTargetG: string;
  preferredSupermarket: string;
  kitchenEquipment: string[];
  pantryBasics: string[];
};

export const defaultProfileForm = (
  displayName = "",
): ProfileFormData => ({
  displayName,
  diet: "plant_based",
  goal: "maintenance",
  allergies: [],
  dislikes: "",
  budgetWeeklyGbp: "40",
  cookingSkill: "beginner",
  cookingTimeMinutes: 30,
  householdSize: 1,
  mealsPerDay: 3,
  includeSnacks: true,
  calorieTarget: "",
  proteinTargetG: "",
  preferredSupermarket: "Tesco",
  kitchenEquipment: ["Oven", "Hob / stove"],
  pantryBasics: ["Rice", "Pasta", "Olive oil", "Spices"],
});
