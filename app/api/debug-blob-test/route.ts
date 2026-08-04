import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

const DIAG_KEY = "diag-2026-08-04-cristal";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("key") !== DIAG_KEY) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const blob = await put(`diagnostic/${Date.now()}.txt`, "diagnostic test", {
      access: "public",
      addRandomSuffix: true,
    });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        name: error instanceof Error ? error.constructor.name : "unknown",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
