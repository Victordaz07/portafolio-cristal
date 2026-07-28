import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Falta el parámetro url" }, { status: 400 });
  }

  try {
    const response = await fetch(url, { method: "GET", redirect: "follow" });
    return NextResponse.json({ resolvedUrl: response.url });
  } catch {
    return NextResponse.json({ error: "No se pudo resolver la URL" }, { status: 400 });
  }
}
