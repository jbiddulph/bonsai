"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth/client";

export function SignOutButton({
  className = "",
  label = "Sign out",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await authClient.signOut();
              router.push("/auth/sign-in");
              router.refresh();
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Could not sign out. Try again.",
              );
            }
          });
        }}
        className={
          className ||
          "inline-flex items-center gap-2 rounded-full border border-leaf/20 px-5 py-2.5 text-sm font-medium text-leaf-deep transition hover:bg-leaf/5 disabled:opacity-50"
        }
      >
        <LogOut className={`size-4 ${pending ? "animate-pulse" : ""}`} />
        {pending ? "Signing out…" : label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
