import { NextResponse } from "next/server";
import { analyzeScan } from "@/app/actions/scan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rawText?: string; label?: string };
    const result = await analyzeScan({
      rawText: body.rawText ?? "",
      label: body.label,
    });
    const status = result.ok ? 200 : result.code === "LIMIT" ? 402 : 400;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("[api/scans/analyze]", error);
    return NextResponse.json(
      {
        ok: false as const,
        error:
          error instanceof Error
            ? error.message
            : "Could not analyse that label.",
      },
      { status: 500 },
    );
  }
}
