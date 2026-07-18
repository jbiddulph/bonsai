"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/app/actions/profile";
import {
  ALLERGY_OPTIONS,
  DIET_OPTIONS,
  EQUIPMENT_OPTIONS,
  GOAL_OPTIONS,
  PANTRY_STAPLES,
  SKILL_OPTIONS,
  SUPERMARKET_OPTIONS,
  TIME_OPTIONS,
  type ProfileFormData,
} from "@/lib/profile-options";
import { cn } from "@/lib/utils";

const STEPS = ["Basics", "Kitchen", "Preferences", "Pantry"] as const;

type Props = {
  initial: ProfileFormData;
  mode: "onboarding" | "settings";
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition",
        active
          ? "border-leaf bg-leaf text-mist"
          : "border-leaf/15 bg-mist text-foreground/75 hover:border-sprout/50",
      )}
    >
      {children}
    </button>
  );
}

export function ProfileWizard({ initial, mode }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProfileFormData>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const progress = useMemo(
    () => ((step + 1) / STEPS.length) * 100,
    [step],
  );

  function toggleList(key: "allergies" | "kitchenEquipment" | "pantryBasics", value: string) {
    setForm((prev) => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(value)
          ? list.filter((v) => v !== value)
          : [...list, value],
      };
    });
  }

  function validateStep(): string | null {
    if (step === 0 && !form.displayName.trim()) {
      return "Add a display name so we can personalise your plans.";
    }
    if (step === 1 && form.kitchenEquipment.length === 0) {
      return "Pick at least one piece of kitchen equipment.";
    }
    return null;
  }

  function next() {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit(completeOnboarding: boolean) {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await saveProfile(form, {
          completeOnboarding,
          replacePantryBasics: mode === "onboarding" || completeOnboarding,
        });
        router.push(mode === "onboarding" ? "/app" : "/app/settings");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save profile");
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm text-foreground/60">
          <span>
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-leaf/10">
          <div
            className="h-full rounded-full bg-sprout transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {step === 0 && (
        <section className="space-y-6">
          <div>
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-leaf-deep">
              Tell us about you
            </h2>
            <p className="mt-2 text-sm text-foreground/65">
              We use this to shape meal plans around your goals and diet.
            </p>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Display name</span>
            <input
              value={form.displayName}
              onChange={(e) =>
                setForm((f) => ({ ...f, displayName: e.target.value }))
              }
              className="w-full rounded-xl border border-leaf/15 bg-mist px-3 py-2.5 outline-none ring-leaf/30 focus:ring-2"
              placeholder="Alex"
            />
          </label>
          <div className="space-y-2">
            <span className="text-sm font-medium">Diet</span>
            <div className="flex flex-wrap gap-2">
              {DIET_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  active={form.diet === opt.value}
                  onClick={() => setForm((f) => ({ ...f, diet: opt.value }))}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Goal</span>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  active={form.goal === opt.value}
                  onClick={() => setForm((f) => ({ ...f, goal: opt.value }))}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Household size</span>
              <input
                type="number"
                min={1}
                max={12}
                value={form.householdSize}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    householdSize: Number(e.target.value) || 1,
                  }))
                }
                className="w-full rounded-xl border border-leaf/15 bg-mist px-3 py-2.5 outline-none ring-leaf/30 focus:ring-2"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Meals per day</span>
              <input
                type="number"
                min={1}
                max={6}
                value={form.mealsPerDay}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    mealsPerDay: Number(e.target.value) || 3,
                  }))
                }
                className="w-full rounded-xl border border-leaf/15 bg-mist px-3 py-2.5 outline-none ring-leaf/30 focus:ring-2"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.includeSnacks}
              onChange={(e) =>
                setForm((f) => ({ ...f, includeSnacks: e.target.checked }))
              }
              className="size-4 accent-leaf"
            />
            Include snacks in my plans
          </label>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-6">
          <div>
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-leaf-deep">
              Cooking reality check
            </h2>
            <p className="mt-2 text-sm text-foreground/65">
              Skill, time, and kit — so recipes match your kitchen.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Cooking skill</span>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  active={form.cookingSkill === opt.value}
                  onClick={() =>
                    setForm((f) => ({ ...f, cookingSkill: opt.value }))
                  }
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Typical cooking time</span>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  active={form.cookingTimeMinutes === opt.value}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      cookingTimeMinutes: opt.value,
                    }))
                  }
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Kitchen equipment</span>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((item) => (
                <Chip
                  key={item}
                  active={form.kitchenEquipment.includes(item)}
                  onClick={() => toggleList("kitchenEquipment", item)}
                >
                  {item}
                </Chip>
              ))}
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-6">
          <div>
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-leaf-deep">
              Preferences & budget
            </h2>
            <p className="mt-2 text-sm text-foreground/65">
              Allergies, dislikes, and spend targets keep plans realistic.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Allergies</span>
            <div className="flex flex-wrap gap-2">
              {ALLERGY_OPTIONS.map((item) => (
                <Chip
                  key={item}
                  active={form.allergies.includes(item)}
                  onClick={() => toggleList("allergies", item)}
                >
                  {item}
                </Chip>
              ))}
            </div>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Dislikes (comma-separated)</span>
            <input
              value={form.dislikes}
              onChange={(e) =>
                setForm((f) => ({ ...f, dislikes: e.target.value }))
              }
              className="w-full rounded-xl border border-leaf/15 bg-mist px-3 py-2.5 outline-none ring-leaf/30 focus:ring-2"
              placeholder="mushrooms, coriander"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Weekly food budget (£)</span>
              <input
                value={form.budgetWeeklyGbp}
                onChange={(e) =>
                  setForm((f) => ({ ...f, budgetWeeklyGbp: e.target.value }))
                }
                className="w-full rounded-xl border border-leaf/15 bg-mist px-3 py-2.5 outline-none ring-leaf/30 focus:ring-2"
                placeholder="40"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Preferred supermarket</span>
              <select
                value={form.preferredSupermarket}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    preferredSupermarket: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-leaf/15 bg-mist px-3 py-2.5 outline-none ring-leaf/30 focus:ring-2"
              >
                {SUPERMARKET_OPTIONS.map((shop) => (
                  <option key={shop} value={shop}>
                    {shop}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Calorie target (optional)</span>
              <input
                value={form.calorieTarget}
                onChange={(e) =>
                  setForm((f) => ({ ...f, calorieTarget: e.target.value }))
                }
                className="w-full rounded-xl border border-leaf/15 bg-mist px-3 py-2.5 outline-none ring-leaf/30 focus:ring-2"
                placeholder="2000"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Protein target g (optional)</span>
              <input
                value={form.proteinTargetG}
                onChange={(e) =>
                  setForm((f) => ({ ...f, proteinTargetG: e.target.value }))
                }
                className="w-full rounded-xl border border-leaf/15 bg-mist px-3 py-2.5 outline-none ring-leaf/30 focus:ring-2"
                placeholder="120"
              />
            </label>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-6">
          <div>
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-leaf-deep">
              Pantry basics
            </h2>
            <p className="mt-2 text-sm text-foreground/65">
              Tick what you usually keep. We&apos;ll plan around these first.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PANTRY_STAPLES.map((item) => (
              <Chip
                key={item}
                active={form.pantryBasics.includes(item)}
                onClick={() => toggleList("pantryBasics", item)}
              >
                {item}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={back}
          disabled={step === 0 || pending}
          className="rounded-full px-4 py-2 text-sm font-medium text-foreground/70 disabled:opacity-40"
        >
          Back
        </button>
        <div className="flex gap-2">
          {mode === "settings" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => submit(false)}
              className="rounded-full border border-leaf/20 px-5 py-2.5 text-sm font-semibold text-leaf-deep disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-mist hover:bg-leaf-deep"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => submit(true)}
              className="rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-mist hover:bg-leaf-deep disabled:opacity-50"
            >
              {pending
                ? "Saving…"
                : mode === "onboarding"
                  ? "Finish & open app"
                  : "Save & mark complete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
