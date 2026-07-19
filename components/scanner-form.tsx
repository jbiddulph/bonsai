"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ScanLine, Sparkles } from "lucide-react";
import { CameraScanner } from "@/components/camera-scanner";
import { GeneratingOverlay } from "@/components/loading-sprout";
import type { ScanAnalysis } from "@/lib/ai/scanner";
import { recognizeLabelPhoto } from "@/lib/ocr-label";
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

type Mode = "scan" | "paste";

export function ScannerForm({ remaining, used, limit, isPremium }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("scan");
  const [label, setLabel] = useState("");
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<ScanAnalysis | null>(null);
  const [productThumb, setProductThumb] = useState<string | null>(null);
  const [ocrPreview, setOcrPreview] = useState(false);
  const [pending, startTransition] = useTransition();
  const atLimit = !isPremium && remaining <= 0;

  const analyzeText = useCallback(
    async (text: string, productLabel: string) => {
      const res = await fetch("/api/scans/analyze", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rawText: text, label: productLabel }),
      });
      const data = (await res.json()) as AnalyzeResult;
      if (!data.ok) {
        setError(data.error);
        setResult(null);
        setStatus(null);
        return false;
      }
      setResult(data.analysis);
      setStatus("Done");
      setOcrPreview(false);
      router.refresh();
      return true;
    },
    [router],
  );

  const handleBarcode = useCallback(
    (code: string) => {
      if (pending || atLimit) return;
      setStatus(`Barcode ${code}…`);
      setError(null);
      setProductThumb(null);
      setOcrPreview(false);

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
            setError(
              `${data.error} Tip: use “Take photo” on the ingredients list instead.`,
            );
            setStatus(null);
            return;
          }

          const product = data.product;
          setProductThumb(product.imageUrl ?? null);
          const name = [product.name, product.brands].filter(Boolean).join(" · ");
          setStatus(`Found ${name}`);

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

          setLabel(name);
          setRawText(enriched);
          setStatus("Analysing…");
          await analyzeText(enriched, name);
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Barcode lookup failed. Try again.",
          );
          setStatus(null);
        }
      });
    },
    [analyzeText, atLimit, pending],
  );

  const handleLabelPhoto = useCallback(
    (file: File) => {
      if (pending || atLimit) return;
      setError(null);
      setProductThumb(null);
      setResult(null);
      setStatus("Enhancing photo & reading text…");

      startTransition(async () => {
        try {
          const { text, confidence } = await recognizeLabelPhoto(file);
          if (text.length < 8) {
            setError(
              "Couldn’t read the label clearly. Try again closer, with more light and less glare — or paste the ingredients.",
            );
            setRawText("");
            setOcrPreview(false);
            setStatus(null);
            setMode("paste");
            return;
          }

          const productLabel = "Label photo";
          setLabel(productLabel);
          setRawText(text);

          // Low confidence → let the user edit before analysing
          if (confidence < 60 || text.length < 40) {
            setOcrPreview(true);
            setStatus(
              `Text looked a bit unclear (${Math.round(confidence)}% confidence). Check below, then analyse.`,
            );
            return;
          }

          setOcrPreview(true);
          setStatus("Analysing…");
          await analyzeText(text, productLabel);
        } catch (e) {
          console.error(e);
          setError(
            e instanceof Error
              ? e.message
              : "Couldn’t read that photo. Try again or paste the text.",
          );
          setStatus(null);
          setMode("paste");
        }
      });
    },
    [analyzeText, atLimit, pending],
  );

  return (
    <div className="space-y-5">
      <GeneratingOverlay
        active={pending}
        label={
          status?.toLowerCase().includes("reading") ||
          status?.toLowerCase().includes("enhancing")
            ? "Reading label…"
            : status?.toLowerCase().includes("barcode") ||
                status?.toLowerCase().includes("found")
              ? "Looking up product…"
              : "Analysing…"
        }
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-leaf/5 p-1">
          {(
            [
              ["scan", "Scan"],
              ["paste", "Type / paste"],
            ] as const
          ).map(([id, title]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === id
                  ? "bg-leaf text-mist shadow-sm"
                  : "text-leaf-deep hover:bg-leaf/10"
              }`}
            >
              {title}
            </button>
          ))}
        </div>
        <p className="text-xs text-foreground/50">
          {isPremium
            ? "Unlimited"
            : `${remaining} scan${remaining === 1 ? "" : "s"} left`}
        </p>
      </div>

      {atLimit && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Free scan limit reached ({limit}/month).{" "}
          <Link href="/app/billing" className="font-semibold underline">
            Upgrade
          </Link>
        </p>
      )}

      {mode === "scan" ? (
        <CameraScanner
          disabled={atLimit}
          busy={pending}
          onBarcode={handleBarcode}
          onLabelPhoto={handleLabelPhoto}
          status={null}
        />
      ) : (
        <div className="space-y-4 rounded-2xl border border-leaf/10 bg-mist p-5">
          <p className="text-sm text-foreground/65">
            Paste ingredients from a label or menu when the camera isn’t handy.
          </p>
          <div>
            <label
              className="text-sm font-medium text-leaf-deep"
              htmlFor="scan-label"
            >
              Product name (optional)
            </label>
            <input
              id="scan-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Tesco pesto"
              className="mt-1.5 w-full rounded-xl border border-leaf/15 bg-white px-3 py-2.5 text-sm outline-none ring-leaf/30 focus:ring-2"
            />
          </div>
          <div>
            <label
              className="text-sm font-medium text-leaf-deep"
              htmlFor="scan-text"
            >
              Ingredients / menu text
            </label>
            <textarea
              id="scan-text"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={7}
              placeholder="Ingredients: Water, Tomatoes, Milk powder, Whey…"
              className="mt-1.5 w-full rounded-xl border border-leaf/15 bg-white px-3 py-2.5 text-sm outline-none ring-leaf/30 focus:ring-2"
            />
          </div>
          <button
            type="button"
            disabled={pending || atLimit || rawText.trim().length < 8}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                setStatus("Analysing…");
                await analyzeText(rawText, label || "Pasted label");
              });
            }}
            className="inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-2.5 text-sm font-semibold text-mist transition hover:bg-leaf-deep disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ScanLine className="size-4" />
            )}
            Analyse
          </button>
        </div>
      )}

      {(ocrPreview || (rawText && result)) && (
        <div className="space-y-3 rounded-2xl border border-leaf/10 bg-white/80 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {productThumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={productThumb}
                  alt=""
                  className="size-16 rounded-lg object-cover"
                />
              )}
              <div>
                <p className="text-xs font-semibold tracking-wide text-sprout uppercase">
                  What we read
                </p>
                <p className="mt-0.5 font-medium text-leaf-deep">
                  {label || "Scan"}
                </p>
              </div>
            </div>
            {ocrPreview && !pending && (
              <button
                type="button"
                disabled={atLimit || rawText.trim().length < 8}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    setStatus("Analysing…");
                    await analyzeText(rawText, label || "Label photo");
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-leaf px-3 py-1.5 text-xs font-semibold text-mist hover:bg-leaf-deep disabled:opacity-50"
              >
                <Sparkles className="size-3.5" />
                Analyse this text
              </button>
            )}
          </div>
          <textarea
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setOcrPreview(true);
            }}
            rows={5}
            className="w-full rounded-xl border border-leaf/15 bg-mist/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-leaf/30"
          />
          <p className="text-xs text-foreground/50">
            You can edit any OCR mistakes here, then analyse again.
          </p>
        </div>
      )}

      {status && !pending && (
        <p className="text-sm text-foreground/60" role="status">
          {status}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!isPremium && !atLimit && (
        <p className="text-center text-xs text-foreground/45">
          {used}/{limit} free scans used this month
        </p>
      )}

      {result && (
        <div className="space-y-2">
          <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-leaf-deep">
            Result
          </h2>
          <ScanResultCard analysis={result} />
        </div>
      )}
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
      <p className="text-base text-foreground/80">{analysis.summary}</p>
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
          UP {analysis.ultraProcessedScore}/100
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ResultList
          title="Animal / hidden ingredients"
          items={analysis.animalIngredients}
          empty="None detected"
        />
        <ResultList
          title="Allergens"
          items={analysis.allergens}
          empty="None flagged"
        />
        <ResultList
          title="Additives / processing"
          items={analysis.concerningAdditives}
          empty="Looks relatively clean"
        />
        <ResultList
          title="Better alternatives"
          items={analysis.betterAlternatives}
          empty="—"
        />
      </div>
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
