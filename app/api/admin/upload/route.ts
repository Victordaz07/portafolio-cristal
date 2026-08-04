import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { MAX_VIDEO_BYTES, MAX_PHOTO_BYTES } from "@/lib/upload-limits";

export const dynamic = "force-dynamic";

export async function GET() {
  const rawToken = process.env.PUBLIC_BLOB_READ_WRITE_TOKEN;
  return NextResponse.json({
    route: "ok",
    blobConfigured: Boolean(rawToken),
    blobTokenTrimmedDiffers: Boolean(rawToken && rawToken !== rawToken.trim()),
    blobTokenLooksValid: Boolean(rawToken?.trim().startsWith("vercel_blob_rw_")),
    vercelEnvironment: process.env.VERCEL_ENV ?? "unknown",
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const token = process.env.PUBLIC_BLOB_READ_WRITE_TOKEN?.trim();

  if (!token) {
    console.error("PUBLIC_BLOB_READ_WRITE_TOKEN no está disponible en este deployment.");
    return NextResponse.json(
      { error: "El almacenamiento no está configurado en este deployment." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        let kind: "video" | "photo" = "photo";
        if (clientPayload) {
          try {
            const payload = JSON.parse(clientPayload) as { kind?: string };
            if (payload.kind === "video") kind = "video";
          } catch {
            throw new Error("Payload de subida inválido.");
          }
        }

        return {
          allowedContentTypes: kind === "video" ? ["video/*"] : ["image/*"],
          maximumSizeInBytes: kind === "video" ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.info("Carga a Vercel Blob completada:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Error en /api/admin/upload:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo subir el archivo" },
      { status: 400 }
    );
  }
}
