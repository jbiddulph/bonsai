"use client";

import { useState, useTransition } from "react";
import {
  createBillingPortalSession,
  createCheckoutSession,
} from "@/app/actions/billing";

export function BillingActions() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go(
    action: () => Promise<{ ok: boolean; url?: string; error?: string }>,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok || !result.url) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => go(() => createCheckoutSession("premium_monthly"))}
          className="rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-mist hover:bg-leaf-deep disabled:opacity-50"
        >
          Premium £7.99/mo
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => go(() => createCheckoutSession("premium_yearly"))}
          className="rounded-full border border-leaf/20 px-5 py-2.5 text-sm font-semibold text-leaf-deep disabled:opacity-50"
        >
          Premium £69/year
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => go(() => createCheckoutSession("family_monthly"))}
          className="rounded-full border border-leaf/20 px-5 py-2.5 text-sm font-semibold text-leaf-deep disabled:opacity-50"
        >
          Family £14.99/mo
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => go(() => createBillingPortalSession())}
          className="rounded-full px-5 py-2.5 text-sm font-medium text-foreground/70 underline-offset-4 hover:underline disabled:opacity-50"
        >
          Manage billing
        </button>
      </div>
      {error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}
    </div>
  );
}
