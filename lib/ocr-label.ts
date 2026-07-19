/**
 * Client-side label OCR helpers — preprocess + Tesseract for better ingredient reads.
 */

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load that photo."));
    };
    img.src = url;
  });
}

/** Downscale + boost contrast so small ingredient print is easier to read. */
export async function preprocessLabelImage(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const maxW = 1600;
  const scale = Math.min(1, maxW / img.width);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported on this device.");

  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Grayscale + mild contrast stretch
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const contrasted = Math.min(255, Math.max(0, (gray - 128) * 1.35 + 128));
    data[i] = contrasted;
    data[i + 1] = contrasted;
    data[i + 2] = contrasted;
  }
  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Could not process photo."));
        else resolve(blob);
      },
      "image/jpeg",
      0.92,
    );
  });
}

export function cleanOcrText(raw: string): string {
  let text = raw
    .replace(/\r/g, "\n")
    .replace(/[|]/g, "I")
    .replace(/\u00A0/g, " ")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Prefer the ingredients block when OCR captures the whole pack
  const ingredientsMatch = text.match(
    /ingredients?\s*[:.\-]?\s*([\s\S]{20,})/i,
  );
  if (ingredientsMatch?.[1]) {
    text = `Ingredients: ${ingredientsMatch[1].trim()}`;
  }

  return text.trim();
}

export type OcrResult = {
  text: string;
  confidence: number;
};

export async function recognizeLabelPhoto(file: File): Promise<OcrResult> {
  const { createWorker, PSM } = await import("tesseract.js");
  const prepared = await preprocessLabelImage(file);
  const worker = await createWorker("eng", 1, {
    logger: () => {},
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });

    const first = await worker.recognize(prepared);
    let text = cleanOcrText(first.data.text);
    let confidence = first.data.confidence ?? 0;

    if (confidence < 55 || text.length < 20) {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      });
      const second = await worker.recognize(prepared);
      const alt = cleanOcrText(second.data.text);
      if (alt.length > text.length) {
        text = alt;
        confidence = second.data.confidence ?? confidence;
      }
    }

    return { text, confidence };
  } finally {
    await worker.terminate();
  }
}
