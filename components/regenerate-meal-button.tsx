"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { regenerateMealInPlan } from "@/app/actions/meal-plan";

export function RegenerateMealButton({
  planId,
  dayIndex,
  slot,
}: {
  planId: string;
  dayIndex: number;
  slot: "breakfast" | "lunch" | "dinner" | "snack";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await regenerateMealInPlan({ planId, dayIndex, slot });
          router.refresh();
        });
      }}
      className="inline-flex items-center gap-1 text-xs font-medium text-leaf underline-offset-2 hover:underline disabled:opacity-50"
    >
      {pending && <Loader2 className="size-3 animate-spin" />}
      {pending ? "Swapping…" : "Swap"}
    </button>
  );
}
