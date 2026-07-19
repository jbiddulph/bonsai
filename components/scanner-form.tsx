"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ScanLine } from "lucide-react";
import { GeneratingOverlay } from "@/components/loading-sprout";
import type { ScanAnalysis } from "@/lib/ai/scanner";

type Props = {
  remaining: number;
  used: number;
  limit: number;
  isPremium: boolean;
};

type AnalyzeResult =
  | { ok: true; scanId: string; analysis: ScanAnalysis }
  | { ok: false; error: string; code?: string };

export function ScannerForm({ remaining, used, limit, isPremium }: Props) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanAnalysis | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <GeneratingOverlay active={pending} label="Scanning ingredients…" />

      <div className="space-y-4 rounded-2xl border border-leaf/10 bg-mist p-5">
        <div>
          <label className="text-sm font-medium text-leaf-deep" htmlFor="scan-label">
            Product or dish name (optional)
          </label>
          <input
            id="scan-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Tesco pesto, restaurant lasagne"
            className="mt-1.5 w-full rounded-xl border border-leaf/15 bg-white px-3 py-2.5 text-sm outline-none ring-leaf/30 focus:ring-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-leaf-deep" htmlFor="scan-text">
            Paste ingredients or menu text
          </label>
          <textarea
            id="scan-text"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
            placeholder="Ingredients: Water, Tomatoes, Milk powder, Whey, Salt…"
            className="mt-1.5 w-full rounded-xl border border-leaf/15 bg-white px-3 py-2.5 text-sm outline-none ring-leaf/30 focus:ring-2"
          />
          <p className="mt-2 text-xs text-foreground/50">
            Tip: photograph a label, then paste the OCR/text from your phone Notes
            app. Photo upload + OCR arrives next.
          </p>
        </div>

        <button
          type="button"
          disabled={pending || (!isPremium && remaining <= 0)}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                const res = await fetch("/api/scans/analyze", {
                  method: "POST",
                  credentials: "same-origin",
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ rawText, label }),
                });
                const data = (await res.json()) as AnalyzeResult;
                if (!data.ok) {
                  setError(data.error);
                  setResult(null);
                  return;
                }
                setResult(data.analysis);
                router.refresh();
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Scan failed. Try again.",
                );
              }
            });
          }}
          className="inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-mist transition hover:bg-leaf-deep disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ScanLine className="size-4" />
          )}
          {pending ? "Analysing…" : "Analyse label"}
        </button>

        <p className="text-sm text-foreground/60">
          {isPremium
            ? "Premium · unlimited scans"
            : `${used}/${limit} free scans used this month (${remaining} left)`}
          {!isPremium && remaining <= 0 && (
            <>
              {" · "}
              <Link href="/app/billing" className="font-medium text-leaf underline">
                Upgrade
              </Link>
            </>
          )}
        </p>
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      {result && <ScanResultCard analysis={result} />}
    </div>
  );
}

export function ScanResultCard({ analysis }: { analysis: ScanAnalysis }) {
  return (
    <div className="space-y-4 rounded-2xl border border-leaf/10 bg-white/70 p-5">
      {analysis.warning && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {analysis.warning}
        </p>
      )}
      <p className="text-sm text-foreground/75">{analysis.summary}</p>
      <div className="flex flex-wrap gap-2">
        <Badge ok={analysis.isVegan} label={analysis.isVegan ? "Vegan" : "Not vegan"} />
        <Badge
          ok={analysis.isVegetarian}
          label={analysis.isVegetarian ? "Vegetarian" : "Not vegetarian"}
        />
        <span className="rounded-full bg-leaf/10 px-3 py-1 text-xs font-medium text-leaf-deep">
          Health {analysis.healthScore}/100
        </span>
        <span className="rounded-full bg-leaf/10 px-3 py-1 text-xs font-medium text-leaf-deep">
          UP score {analysis.ultraProcessedScore}/100
        </span>
      </div>

      <ResultList title="Animal / hidden ingredients" items={analysis.animalIngredients} empty="None detected" />
      <ResultList title="Allergens flagged" items={analysis.allergens} empty="None flagged" />
      <ResultList
        title="Additives / processing notes"
        items={analysis.concerningAdditives}
        empty="Looks relatively clean"
      />
      <ResultList
        title="Better alternatives"
        items={analysis.betterAlternatives}
        empty="—"
      />
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        ok ? "bg-sprout/20 text-leaf-deep" : "bg-red-100 text-red-800"
      }`}
    >
      {label}
    </span>
  );
}

function ResultList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-sprout uppercase">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-foreground/55">{empty}</p>
      ) : (
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-foreground/75">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
