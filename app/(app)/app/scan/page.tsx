import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getScanUsage, listScans } from "@/app/actions/scan";
import { ScanResultCard, ScannerForm } from "@/components/scanner-form";
import type { ScanAnalysis } from "@/lib/ai/scanner";
import { requireOnboardedProfile } from "@/lib/onboarding-gate";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  await requireOnboardedProfile();
  const usage = await getScanUsage();
  const history = await listScans();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
      <Link
        href="/app"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-leaf underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to app
      </Link>

      <p className="text-sm font-medium text-sprout">Module 2</p>
      <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-leaf-deep">
        AI Scanner
      </h1>
      <p className="mt-3 max-w-xl text-foreground/70">
        Two ways to scan: <strong>Scan barcode</strong> (automatic when the
        camera is open) or <strong>Take label photo</strong> to read ingredient
        text. Results analyse vegan status, allergens, and swaps.
      </p>

      <div className="mt-8">
        <ScannerForm
          remaining={
            usage.remaining === Infinity ? 999 : Number(usage.remaining)
          }
          used={usage.used}
          limit={usage.limit === Infinity ? 999 : Number(usage.limit)}
          isPremium={usage.isPremium}
        />
      </div>

      <section className="mt-12">
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-leaf-deep">
          Recent scans
        </h2>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/60">
            No scans yet — open the camera or paste a label to start.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {history.map((scan) => {
              const result = (scan.result ?? {}) as ScanAnalysis & {
                label?: string | null;
              };
              return (
                <li
                  key={scan.id}
                  className="rounded-2xl border border-leaf/10 bg-mist/80 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium text-leaf-deep">
                      {result.label || "Untitled scan"}
                    </p>
                    <p className="text-xs text-foreground/50">
                      {scan.createdAt
                        ? new Date(scan.createdAt).toLocaleString("en-GB")
                        : ""}
                    </p>
                  </div>
                  {scan.rawText && (
                    <p className="mb-3 line-clamp-2 text-xs text-foreground/55">
                      {scan.rawText}
                    </p>
                  )}
                  <ScanResultCard
                    analysis={{
                      summary: result.summary ?? "",
                      isVegan: scan.isVegan ?? result.isVegan ?? false,
                      isVegetarian:
                        scan.isVegetarian ?? result.isVegetarian ?? false,
                      healthScore: scan.healthScore ?? result.healthScore ?? 0,
                      ultraProcessedScore: result.ultraProcessedScore ?? 0,
                      animalIngredients: result.animalIngredients ?? [],
                      allergens: result.allergens ?? [],
                      concerningAdditives: result.concerningAdditives ?? [],
                      betterAlternatives: result.betterAlternatives ?? [],
                      provider: result.provider ?? "rules",
                      warning: result.warning,
                    }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
