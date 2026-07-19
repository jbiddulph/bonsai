"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ScanLine } from "lucide-react";
import { CameraScanner } from "@/components/camera-scanner";
import { GeneratingOverlay } from "@/components/loading-sprout";
import type { ScanAnalysis } from "@/lib/ai/scanner";
import type { BarcodeProduct } from "@/lib/open-food-facts";

type Props = {
  remaining: number;
  used: number;
  limit: number;
  isPremium: boolean;
};

type AnalyzeResult =
  | { ok: true; scanId: string; analysis: ScanAnalysis }
  | { ok: false; error: string; code?: string };

type Mode = "camera" | "paste";

export function ScannerForm({ remaining, used, limit, isPremium }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("camera");
  const [label, setLabel] = useState("");
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<ScanAnalysis | null>(null);
  const [productThumb, setProductThumb] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const atLimit = !isPremium && remaining <= 0;

  const runAnalysis = useCallback(
    (text: string, productLabel: string) => {
      if (atLimit) {
        setError(
          `Free scan limit reached (${limit}/month). Upgrade to Premium for unlimited scans.`,
        );
        return;
      }
      if (text.trim().length < 8) {
        setError("Not enough text to analyse. Try another photo or paste ingredients.");
        return;
      }

      setError(null);
      setLabel(productLabel);
      setRawText(text);
      setStatus("Analysing ingredients…");

      startTransition(async () => {
        try {
          const res = await fetch("/api/scans/analyze", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              rawText: text,
              label: productLabel,
            }),
          });
          const data = (await res.json()) as AnalyzeResult;
          if (!data.ok) {
            setError(data.error);
            setResult(null);
            setStatus(null);
            return;
          }
          setResult(data.analysis);
          setStatus("Scan complete");
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Scan failed. Try again.");
          setStatus(null);
        }
      });
    },
    [atLimit, limit, router],
  );

  const handleBarcode = useCallback(
    (code: string) => {
      if (pending || atLimit) return;
      setStatus(`Barcode ${code} — looking up product…`);
      setError(null);
      setProductThumb(null);

      startTransition(async () => {
        try {
          const res = await fetch(
            `/api/scans/barcode?barcode=${encodeURIComponent(code)}`,
            { credentials: "same-origin" },
          );
          const data = (await res.json()) as
            | { ok: true; product: BarcodeProduct }
            | { ok: false; error: string };

          if (!data.ok) {
            setError(data.error);
            setStatus(null);
            return;
          }

          const product = data.product;
          setProductThumb(product.imageUrl ?? null);
          const name = [product.name, product.brands].filter(Boolean).join(" · ");
          setStatus(`Found ${name} — analysing…`);

          const enriched = [
            product.ingredientsText,
            product.nutriscore
              ? `Nutri-Score: ${product.nutriscore.toUpperCase()}`
              : "",
            product.novaGroup != null ? `NOVA group: ${product.novaGroup}` : "",
            product.isVeganTagged === true
              ? "Open Food Facts tags this as vegan."
              : product.isVeganTagged === false
                ? "Open Food Facts tags this as non-vegan."
                : "",
          ]
            .filter(Boolean)
            .join("\n");

          // Nested startTransition is fine; run analysis inline to avoid race
          setLabel(name);
          setRawText(enriched);

          const analyzeRes = await fetch("/api/scans/analyze", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ rawText: enriched, label: name }),
          });
          const analyzeData = (await analyzeRes.json()) as AnalyzeResult;
          if (!analyzeData.ok) {
            setError(analyzeData.error);
            setStatus(null);
            return;
          }
          setResult(analyzeData.analysis);
          setStatus("Scan complete");
          router.refresh();
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Barcode lookup failed. Try again.",
          );
          setStatus(null);
        }
      });
    },
    [atLimit, pending, router],
  );

  const handleLabelPhoto = useCallback(
    (file: File) => {
      if (pending || atLimit) return;
      setError(null);
      setProductThumb(null);
      setStatus("Reading label with OCR…");

      startTransition(async () => {
        try {
          const { createWorker } = await import("tesseract.js");
          const worker = await createWorker("eng");
          const {
            data: { text },
          } = await worker.recognize(file);
          await worker.terminate();

          const cleaned = text.replace(/\s+/g, " ").trim();
          if (cleaned.length < 8) {
            setError(
              "Couldn’t read enough text from that photo. Try a sharper, closer label or paste the ingredients.",
            );
            setStatus(null);
            return;
          }

          const productLabel =
            label.trim() || file.name.replace(/\.[^.]+$/, "") || "Label photo";
          setStatus("Label read — analysing…");
          setLabel(productLabel);
          setRawText(cleaned);

          const analyzeRes = await fetch("/api/scans/analyze", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ rawText: cleaned, label: productLabel }),
          });
          const analyzeData = (await analyzeRes.json()) as AnalyzeResult;
          if (!analyzeData.ok) {
            setError(analyzeData.error);
            setStatus(null);
            return;
          }
          setResult(analyzeData.analysis);
          setStatus("Scan complete");
          router.refresh();
        } catch (e) {
          console.error(e);
          setError(
            e instanceof Error
              ? e.message
              : "OCR failed. Try again or paste the ingredients.",
          );
          setStatus(null);
        }
      });
    },
    [atLimit, label, pending, router],
  );

  return (
    <div className="space-y-6">
      <GeneratingOverlay
        active={pending}
        label={status?.includes("OCR") ? "Reading label…" : "Scanning…"}
      />

      <div className="flex gap-2 rounded-full bg-leaf/5 p-1">
        {(
          [
            ["camera", "Camera / barcode"],
            ["paste", "Paste text"],
          ] as const
        ).map(([id, title]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
              mode === id
                ? "bg-leaf text-mist shadow-sm"
                : "text-leaf-deep hover:bg-leaf/10"
            }`}
          >
            {title}
          </button>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border border-leaf/10 bg-mist p-5">
        {mode === "camera" ? (
          <CameraScanner
            disabled={pending || atLimit}
            onBarcode={handleBarcode}
            onLabelPhoto={handleLabelPhoto}
            status={status}
          />
        ) : (
          <>
            <div>
              <label
                className="text-sm font-medium text-leaf-deep"
                htmlFor="scan-label"
              >
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
              <label
                className="text-sm font-medium text-leaf-deep"
                htmlFor="scan-text"
              >
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
            </div>
            <button
              type="button"
              disabled={pending || atLimit}
              onClick={() => runAnalysis(rawText, label)}
              className="inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-mist transition hover:bg-leaf-deep disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ScanLine className="size-4" />
              )}
              {pending ? "Analysing…" : "Analyse label"}
            </button>
          </>
        )}

        {productThumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={productThumb}
            alt={label || "Product"}
            className="h-24 w-24 rounded-xl object-cover"
          />
        )}

        {(label || rawText) && mode === "camera" && (
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-leaf">
              Scanned text
            </summary>
            <p className="mt-2 font-medium text-leaf-deep">{label}</p>
            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-white/80 p-3 text-xs text-foreground/70">
              {rawText}
            </pre>
          </details>
        )}

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

      <ResultList
        title="Animal / hidden ingredients"
        items={analysis.animalIngredients}
        empty="None detected"
      />
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
