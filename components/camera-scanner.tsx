"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CameraOff,
  FileImage,
  Loader2,
  ScanBarcode,
  ScanLine,
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

/**
 * Two separate flows:
 * 1. Scan barcode → live camera auto-reads EAN/UPC, then looks up the product
 * 2. Scan label photo → take/upload a photo, OCR reads ingredients (not automatic from live video)
 */
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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastCodeRef = useRef<string>("");
  const lastAtRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onBarcodeRef = useRef(onBarcode);
  onBarcodeRef.current = onBarcode;

  const stopBarcodeCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setBarcodeMode(false);
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      // already stopped
    }
  }, []);

  const startBarcodeCamera = useCallback(async () => {
    if (disabled || busy) return;
    setCamError(null);
    setLastBarcode(null);
    setStarting(true);
    try {
      await stopBarcodeCamera();
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

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 140 },
          aspectRatio: 1.777,
        },
        (decoded) => {
          const now = Date.now();
          if (
            decoded === lastCodeRef.current &&
            now - lastAtRef.current < 4000
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
        () => {
          // frame miss
        },
      );
      setBarcodeMode(true);
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
  }, [busy, disabled, stopBarcodeCamera]);

  useEffect(() => {
    return () => {
      void stopBarcodeCamera();
    };
  }, [stopBarcodeCamera]);

  // Pause live scanning while a lookup/analysis is running
  useEffect(() => {
    const scanner = scannerRef.current;
    if (!scanner || !barcodeMode) return;
    if (busy && scanner.isScanning) {
      void scanner.pause(true);
    } else if (!busy && scanner.isScanning === false) {
      try {
        scanner.resume();
      } catch {
        // ignore
      }
    }
  }, [busy, barcodeMode]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-leaf/15 bg-white/70 p-4">
          <div className="flex items-center gap-2 text-leaf-deep">
            <ScanBarcode className="size-5" />
            <h3 className="font-semibold">1. Scan barcode</h3>
          </div>
          <p className="mt-2 text-sm text-foreground/65">
            Opens the camera and <strong>automatically</strong> reads the
            barcode, then fetches product info.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!barcodeMode ? (
              <button
                type="button"
                disabled={disabled || busy || starting}
                onClick={() => void startBarcodeCamera()}
                className="inline-flex items-center gap-2 rounded-full bg-leaf px-4 py-2.5 text-sm font-semibold text-mist hover:bg-leaf-deep disabled:opacity-50"
              >
                {starting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ScanBarcode className="size-4" />
                )}
                {starting ? "Opening…" : "Scan barcode"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void stopBarcodeCamera()}
                className="inline-flex items-center gap-2 rounded-full border border-leaf/20 px-4 py-2.5 text-sm font-medium text-leaf-deep hover:bg-leaf/5"
              >
                <CameraOff className="size-4" />
                Stop barcode camera
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-leaf/15 bg-white/70 p-4">
          <div className="flex items-center gap-2 text-leaf-deep">
            <ScanLine className="size-5" />
            <h3 className="font-semibold">2. Scan ingredients label</h3>
          </div>
          <p className="mt-2 text-sm text-foreground/65">
            Take a photo of the ingredients list. OCR reads the text, then we
            analyse it. <strong>Not automatic</strong> from the live barcode
            camera.
          </p>
          <div className="mt-3">
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-leaf/20 bg-mist px-4 py-2.5 text-sm font-semibold text-leaf-deep hover:bg-leaf/5 disabled:opacity-50"
            >
              <FileImage className="size-4" />
              Take label photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) {
                  void stopBarcodeCamera();
                  onLabelPhoto(file);
                }
              }}
            />
          </div>
        </div>
      </div>

      <div
        id={SCANNER_ID}
        className={`relative overflow-hidden rounded-xl bg-leaf-deep/90 ${
          barcodeMode ? "min-h-[240px]" : "hidden"
        }`}
      />

      {barcodeMode && (
        <div className="rounded-xl border border-sprout/30 bg-sprout/10 px-3 py-2 text-sm text-leaf-deep">
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Barcode detected{lastBarcode ? ` (${lastBarcode})` : ""} — fetching
              product info…
            </span>
          ) : (
            <span>
              Point the box at the barcode. Scanning is{" "}
              <strong>automatic</strong> — no extra button needed. Hold steady
              until it beeps/vibrates.
            </span>
          )}
        </div>
      )}

      {status && (
        <p className="text-sm font-medium text-leaf-deep" role="status">
          {status}
        </p>
      )}
      {camError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {camError} On iPhone, use Safari and allow camera access. You can
          still use “Take label photo”.
        </p>
      )}
    </div>
  );
}
