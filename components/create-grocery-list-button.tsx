"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createBlankShoppingList } from "@/app/actions/grocery";

export function CreateGroceryListButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await createBlankShoppingList();
          router.refresh();
        });
      }}
      className="inline-flex items-center gap-2 rounded-full border border-leaf/20 px-4 py-2 text-sm font-medium text-leaf-deep transition hover:bg-leaf/5 disabled:opacity-50"
    >
      <Plus className="size-4" />
      {pending ? "Creating…" : "New blank list"}
    </button>
  );
}
