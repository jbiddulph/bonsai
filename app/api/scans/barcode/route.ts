import { NextResponse } from "next/server";
import { lookupBarcodeProduct } from "@/lib/open-food-facts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode") ?? "";

  if (!barcode.replace(/\D/g, "")) {
    return NextResponse.json(
      { ok: false as const, error: "Barcode required" },
      { status: 400 },
    );
  }

  try {
    const product = await lookupBarcodeProduct(barcode);
    if (!product) {
      return NextResponse.json(
        {
          ok: false as const,
          error:
            "Product not found in Open Food Facts. Try scanning the ingredients label instead.",
        },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true as const, product });
  } catch (error) {
    console.error("[api/scans/barcode]", error);
    return NextResponse.json(
      {
        ok: false as const,
        error:
          error instanceof Error
            ? error.message
            : "Could not look up that barcode.",
      },
      { status: 500 },
    );
  }
}
