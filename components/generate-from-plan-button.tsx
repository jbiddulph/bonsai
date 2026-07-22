"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronDown, Sparkles } from "lucide-react";
import { createShoppingListFromMealPlan } from "@/app/actions/grocery";

type Plan = {
  id: string;
  title: string;
  createdAt: Date;
};

export function GenerateFromPlanButton({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleGenerate(planId: string) {
    setError(null);
    setShowMenu(false);
    startTransition(async () => {
      const res = await createShoppingListFromMealPlan(planId);
      if (!res.ok) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu((v) => !v)}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-leaf/20 px-5 py-2.5 text-sm font-semibold text-leaf-deep transition hover:bg-leaf/5 disabled:opacity-50"
      >
        <Calendar className="size-4" />
        Generate from 7-day plan
        <ChevronDown className="size-3.5" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-leaf/10 bg-white p-2 shadow-lg">
            <p className="px-3 py-2 text-xs font-semibold tracking-wide text-sprout uppercase">
              Select a meal plan
            </p>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {plans.slice(0, 10).map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => handleGenerate(plan.id)}
                  disabled={pending}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-leaf/5 disabled:opacity-50"
                >
                  <Calendar className="mt-0.5 size-4 shrink-0 text-leaf" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-leaf-deep">{plan.title}</p>
                    <p className="mt-0.5 text-xs text-foreground/55">
                      {new Date(plan.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {plans.length === 0 && (
              <p className="px-3 py-4 text-sm text-foreground/60">
                No meal plans yet. Generate one first!
              </p>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="absolute left-0 top-full mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
