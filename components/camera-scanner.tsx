"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2, ScanBarcode } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

type Props = {
  disabled?: boolean;
  onBarcode: (code: string) => void;
  onLabelPhoto: (file: File) => void;
  status?: string | null;
};

const SCANNER_ID = "bonsai-barcode-reader";

export function CameraScanner({
  disabled,
  onBarcode,
  onLabelPhoto,
  status,
}: Props) {
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastCodeRef = useRef<string>("");
  const lastAtRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onBarcodeRef = useRef(onBarcode);
  onBarcodeRef.current = onBarcode;

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setActive(false);
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      // already stopped
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (disabled) return;
    setCamError(null);
    setStarting(true);
    try {
      await stopCamera();
      const scanner = new Html5Qrcode(SCANNER_ID, {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 8,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.777,
        },
        (decoded) => {
          const now = Date.now();
          if (
            decoded === lastCodeRef.current &&
            now - lastAtRef.current < 3500
          ) {
            return;
          }
          lastCodeRef.current = decoded;
          lastAtRef.current = now;
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(40);
          }
          onBarcodeRef.current(decoded);
        },
        () => {
          // frame miss — ignore
        },
      );
      setActive(true);
    } catch (error) {
      console.error("[camera]", error);
      setCamError(
        error instanceof Error
          ? error.message
          : "Could not open the camera. Check permissions, or use photo upload.",
      );
      setActive(false);
    } finally {
      setStarting(false);
    }
  }, [disabled, stopCamera]);

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="space-y-3">
      <div
        id={SCANNER_ID}
        className={`overflow-hidden rounded-xl bg-leaf-deep/90 ${
          active ? "min-h-[240px]" : "hidden"
        }`}
      />

      {!active && (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-leaf/25 bg-leaf/5 px-4 py-10 text-center">
          <ScanBarcode className="size-10 text-leaf" />
          <p className="max-w-sm text-sm text-foreground/70">
            Point at a product barcode for instant lookup, or capture a label
            photo to read the ingredients.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!active ? (
          <button
            type="button"
            disabled={disabled || starting}
            onClick={() => void startCamera()}
            className="inline-flex items-center gap-2 rounded-full bg-leaf px-4 py-2.5 text-sm font-semibold text-mist hover:bg-leaf-deep disabled:opacity-50"
          >
            {starting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            {starting ? "Opening camera…" : "Open camera"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void stopCamera()}
            className="inline-flex items-center gap-2 rounded-full border border-leaf/20 px-4 py-2.5 text-sm font-medium text-leaf-deep hover:bg-leaf/5"
          >
            <CameraOff className="size-4" />
            Stop camera
          </button>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-leaf/20 px-4 py-2.5 text-sm font-medium text-leaf-deep hover:bg-leaf/5 disabled:opacity-50"
        >
          <Camera className="size-4" />
          Take / upload label photo
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
            if (file) onLabelPhoto(file);
          }}
        />
      </div>

      {status && (
        <p className="text-sm font-medium text-leaf-deep" role="status">
          {status}
        </p>
      )}
      {camError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {camError} On iPhone, use Safari and allow camera access — or use
          “Take / upload label photo”.
        </p>
      )}
    </div>
  );
}
