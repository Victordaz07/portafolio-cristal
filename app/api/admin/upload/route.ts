import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const dynamic = "force-dynamic";

const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

export async function GET() {
  return NextResponse.json({
    route: "ok",
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    vercelEnvironment: process.env.VERCEL_ENV ?? "unknown",
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.error("BLOB_READ_WRITE_TOKEN no está disponible en este deployment.");
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
          allowedContentTypes:
            kind === "video"
              ? ["video/mp4", "video/webm", "video/quicktime"]
              : ["image/jpeg", "image/png", "image/webp", "image/avif"],
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
