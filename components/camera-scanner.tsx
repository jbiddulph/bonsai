"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CameraOff,
  FileImage,
  ImagePlus,
  Loader2,
  ScanBarcode,
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

type Props = {
  disabled?: boolean;
  busy?: boolean;
  onBarcode: (code: string) => void;
  onLabelPhoto: (file: File) => void;
  status?: string | null;
};

const SCANNER_ID = "bonsai-barcode-reader";

export function CameraScanner({
  disabled,
  busy,
  onBarcode,
  onLabelPhoto,
  status,
}: Props) {
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [starting, setStarting] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastCodeRef = useRef<string>("");
  const lastAtRef = useRef(0);
  const captureRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const onBarcodeRef = useRef(onBarcode);
  onBarcodeRef.current = onBarcode;
  const autoStarted = useRef(false);

  const stopBarcodeCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setBarcodeMode(false);
    setPaused(false);
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      // already stopped
    }
  }, []);

  const startBarcodeCamera = useCallback(async () => {
    if (disabled) return;
    setCamError(null);
    setLastBarcode(null);
    setStarting(true);
    try {
      await stopBarcodeCamera();

      // Ensure the reader element is visible before html5-qrcode mounts video
      setBarcodeMode(true);
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const scanner = new Html5Qrcode(SCANNER_ID, {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
        ],
      });
      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      const back =
        cameras.find((c) => /back|rear|environment/i.test(c.label)) ??
        cameras[cameras.length - 1];

      await scanner.start(
        back?.id ?? { facingMode: "environment" },
        {
          fps: 12,
          qrbox: (viewW, viewH) => {
            const width = Math.floor(Math.min(viewW * 0.86, 340));
            const height = Math.floor(Math.min(viewH * 0.28, 150));
            return { width, height };
          },
          aspectRatio: 1.777,
          disableFlip: false,
        },
        (decoded) => {
          const now = Date.now();
          if (
            decoded === lastCodeRef.current &&
            now - lastAtRef.current < 4500
          ) {
            return;
          }
          lastCodeRef.current = decoded;
          lastAtRef.current = now;
          setLastBarcode(decoded);
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(50);
          }
          onBarcodeRef.current(decoded);
        },
        () => {},
      );
      setPaused(false);
    } catch (error) {
      console.error("[camera]", error);
      setCamError(
        error instanceof Error
          ? error.message
          : "Could not open the camera. Check permissions.",
      );
      setBarcodeMode(false);
    } finally {
      setStarting(false);
    }
  }, [disabled, stopBarcodeCamera]);

  // Auto-open barcode camera so the main action is ready immediately
  useEffect(() => {
    if (autoStarted.current || disabled) return;
    autoStarted.current = true;
    void startBarcodeCamera();
  }, [disabled, startBarcodeCamera]);

  useEffect(() => {
    return () => {
      void stopBarcodeCamera();
    };
  }, [stopBarcodeCamera]);

  useEffect(() => {
    const scanner = scannerRef.current;
    if (!scanner || !barcodeMode) return;
    try {
      if (busy && !paused) {
        scanner.pause(true);
        setPaused(true);
      } else if (!busy && paused) {
        scanner.resume();
        setPaused(false);
      }
    } catch {
      // ignore pause/resume race
    }
  }, [busy, barcodeMode, paused]);

  function pickLabel(file: File | undefined) {
    if (!file) return;
    void stopBarcodeCamera();
    onLabelPhoto(file);
  }

  return (
    <div className="space-y-5">
      {/* Barcode first — primary action */}
      <section className="overflow-hidden rounded-2xl border border-leaf/15 bg-white/80 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-leaf/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-leaf text-mist">
              <ScanBarcode className="size-4" />
            </span>
            <div>
              <h3 className="font-semibold text-leaf-deep">Scan barcode</h3>
              <p className="text-xs text-foreground/55">
                Automatic · hold steady over the bars
              </p>
            </div>
          </div>
          {barcodeMode ? (
            <button
              type="button"
              onClick={() => void stopBarcodeCamera()}
              className="inline-flex items-center gap-1.5 rounded-full border border-leaf/15 px-3 py-1.5 text-xs font-medium text-leaf-deep hover:bg-leaf/5"
            >
              <CameraOff className="size-3.5" />
              Stop
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled || starting}
              onClick={() => void startBarcodeCamera()}
              className="inline-flex items-center gap-1.5 rounded-full bg-leaf px-3 py-1.5 text-xs font-semibold text-mist hover:bg-leaf-deep disabled:opacity-50"
            >
              {starting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ScanBarcode className="size-3.5" />
              )}
              {starting ? "Opening…" : "Start"}
            </button>
          )}
        </div>

        <div
          id={SCANNER_ID}
          className={`bg-leaf-deep/95 ${
            barcodeMode ? "min-h-[260px] sm:min-h-[300px]" : "hidden"
          }`}
        />

        {!barcodeMode && !starting && (
          <button
            type="button"
            disabled={disabled || starting}
            onClick={() => void startBarcodeCamera()}
            className="flex min-h-[180px] w-full flex-col items-center justify-center gap-3 bg-leaf/5 px-4 py-10 text-center transition hover:bg-leaf/10 disabled:opacity-50"
          >
            <ScanBarcode className="size-10 text-leaf" />
            <span className="text-sm font-semibold text-leaf-deep">
              Tap to open barcode camera
            </span>
            <span className="max-w-xs text-xs text-foreground/55">
              We’ll look up the product and analyse ingredients for you.
            </span>
          </button>
        )}

        {barcodeMode && (
          <div className="border-t border-leaf/10 bg-sprout/10 px-4 py-2.5 text-sm text-leaf-deep">
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Got barcode{lastBarcode ? ` ${lastBarcode}` : ""} — looking up
                product…
              </span>
            ) : (
              <span>
                Align the barcode inside the box. No extra button — it scans by
                itself.
              </span>
            )}
          </div>
        )}
      </section>

      {/* Label photo — secondary */}
      <section className="rounded-2xl border border-leaf/10 bg-mist/80 px-4 py-4">
        <h3 className="font-semibold text-leaf-deep">Or photograph the label</h3>
        <p className="mt-1 text-sm text-foreground/60">
          Best for fresh food / menus without a barcode. Fill the frame with the
          ingredients list, good light, avoid glare.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => captureRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-leaf px-4 py-2.5 text-sm font-semibold text-mist hover:bg-leaf-deep disabled:opacity-50"
          >
            <FileImage className="size-4" />
            Take photo
          </button>
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => galleryRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-leaf/20 px-4 py-2.5 text-sm font-medium text-leaf-deep hover:bg-white disabled:opacity-50"
          >
            <ImagePlus className="size-4" />
            Choose from gallery
          </button>
          <input
            ref={captureRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              pickLabel(file);
            }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              pickLabel(file);
            }}
          />
        </div>
      </section>

      {status && (
        <p className="text-sm font-medium text-leaf-deep" role="status">
          {status}
        </p>
      )}
      {camError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Camera issue: {camError}. You can still take a label photo or paste
          text below.
        </p>
      )}
    </div>
  );
}
