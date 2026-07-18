"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateWeeklyMealPlan } from "@/app/actions/meal-plan";
import Link from "next/link";

type Props = {
  remaining: number;
  used: number;
  limit: number;
  isPremium: boolean;
};

export function GeneratePlanButton({ remaining, used, limit, isPremium }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={pending || (!isPremium && remaining <= 0)}
        onClick={() => {
          setError(null);
          setInfo(null);
          startTransition(async () => {
            try {
              const result = await generateWeeklyMealPlan();
              if (!result.ok) {
                setError(result.error);
                return;
              }
              if (result.warning) {
                setInfo(result.warning);
              }
              router.push(`/app/plan/${result.planId}`);
              router.refresh();
            } catch (e) {
              console.error(e);
              setError(
                e instanceof Error
                  ? e.message
                  : "Generation failed. Please try again.",
              );
            }
          });
        }}
        className="rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-mist transition hover:bg-leaf-deep disabled:opacity-50"
      >
        {pending ? "Generating your week…" : "Generate 7-day plan"}
      </button>
      <p className="text-sm text-foreground/60">
        {isPremium
          ? "Premium · unlimited meal plans"
          : `${used}/${limit} free plans used this month (${remaining} left)`}
        {!isPremium && remaining <= 0 && (
          <>
            {" · "}
            <Link href="/app/billing" className="font-medium text-leaf underline">
              Upgrade
            </Link>
          </>
        )}
      </p>
      {info && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {info}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}{" "}
          {error.includes("Upgrade") && (
            <Link href="/app/billing" className="font-semibold underline">
              View billing
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
