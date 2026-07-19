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
    <main className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-10">
      <Link
        href="/app"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-leaf underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-leaf-deep md:text-4xl">
        AI Scanner
      </h1>
      <p className="mt-2 max-w-lg text-sm text-foreground/65 md:text-base">
        Scan a barcode for instant product info, or photograph an ingredients
        list.
      </p>

      <div className="mt-6">
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
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-leaf-deep">
          Recent scans
        </h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/55">
            Your scans will show up here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {history.map((scan) => {
              const result = (scan.result ?? {}) as ScanAnalysis & {
                label?: string | null;
              };
              return (
                <li
                  key={scan.id}
                  className="rounded-2xl border border-leaf/10 bg-mist/70 p-4"
                >
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium text-leaf-deep">
                      {result.label || "Untitled scan"}
                    </p>
                    <p className="text-xs text-foreground/45">
                      {scan.createdAt
                        ? new Date(scan.createdAt).toLocaleString("en-GB")
                        : ""}
                    </p>
                  </div>
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-leaf">
                      View result
                    </summary>
                    <div className="mt-3">
                      <ScanResultCard
                        analysis={{
                          summary: result.summary ?? "",
                          isVegan: scan.isVegan ?? result.isVegan ?? false,
                          isVegetarian:
                            scan.isVegetarian ?? result.isVegetarian ?? false,
                          healthScore:
                            scan.healthScore ?? result.healthScore ?? 0,
                          ultraProcessedScore: result.ultraProcessedScore ?? 0,
                          animalIngredients: result.animalIngredients ?? [],
                          allergens: result.allergens ?? [],
                          concerningAdditives: result.concerningAdditives ?? [],
                          betterAlternatives: result.betterAlternatives ?? [],
                          provider: result.provider ?? "rules",
                          warning: result.warning,
                        }}
                      />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
