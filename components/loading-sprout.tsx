"use client";

import { Loader2 } from "lucide-react";

export function LoadingSprout({
  label = "Growing…",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-16 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex size-14 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-sprout/25" />
        <span className="absolute inset-1 animate-pulse rounded-full bg-leaf/15" />
        <Loader2 className="relative size-7 animate-spin text-leaf" />
      </div>
      <p className="font-[family-name:var(--font-fraunces)] text-lg text-leaf-deep">
        {label}
      </p>
    </div>
  );
}

export function GeneratingOverlay({
  active,
  label = "Generating your week…",
}: {
  active: boolean;
  label?: string;
}) {
  if (!active) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-leaf-deep/40 backdrop-blur-sm"
      role="alertdialog"
      aria-busy="true"
      aria-label={label}
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-leaf/10 bg-mist px-6 py-8 shadow-lg">
        <LoadingSprout label={label} className="py-2" />
        <div className="mx-auto mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-leaf/10">
          <div className="h-full w-1/2 animate-shimmer-bar rounded-full bg-sprout" />
        </div>
      </div>
    </div>
  );
}
