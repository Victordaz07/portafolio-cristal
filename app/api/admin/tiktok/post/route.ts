import { NextResponse } from "next/server";
import { z } from "zod";
import { getT } from "@/lib/admin-lang-server";
import {
  TikTokPostingError,
  buildDirectPostBody,
  initDirectPost,
  initDraftUpload,
  planChunks,
  queryCreatorInfo,
  tiktokPostingFlags,
  uploadVideoChunks,
} from "@/lib/social/tiktok-posting";
import { isOwnBlobUrl, loadPostingAccount, openBlobVideo, postingErrorResponse } from "@/lib/social/tiktok-posting-server";

export const dynamic = "force-dynamic";
// Subir un video de hasta 250 MB por partes puede tardar.
export const maxDuration = 300;

const schema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("draft"), videoUrl: z.string().url() }),
  z.object({
    mode: z.literal("direct"),
    videoUrl: z.string().url(),
    title: z.string().max(2200),
    // Sin valor por defecto: la persona tiene que elegirla (lo exige TikTok).
    privacyLevel: z.string().min(1),
    allowComment: z.boolean(),
    allowDuet: z.boolean(),
    allowStitch: z.boolean(),
    commercial: z.boolean(),
    yourBrand: z.boolean(),
    brandedContent: z.boolean(),
    durationSec: z.number().positive().nullable().optional(),
    // Consentimiento explícito (Music Usage Confirmation / Branded Content Policy).
    consent: z.literal(true),
  }),
]);

/**
 * Manda el video a TikTok: como borrador a la bandeja de la app (video.upload) o publicado directo
 * (video.publish; antes vuelve a pedir la info del creador para validar privacidad y duración).
 */
export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa los datos de la publicación", "Check the post details") }, { status: 400 });
  const input = parsed.data;
  if (!isOwnBlobUrl(input.videoUrl)) return NextResponse.json({ error: t("Sube el video desde esta pantalla", "Upload the video from this screen") }, { status: 400 });

  const loaded = await loadPostingAccount(t, [input.mode]);
  if ("response" in loaded) return loaded.response;
  const { account, accessToken } = loaded;

  try {
    const video = await openBlobVideo(input.videoUrl);
    let init;
    try {
      if (input.mode === "draft") {
        init = await initDraftUpload(accessToken, video.size);
      } else {
        const creator = await queryCreatorInfo(accessToken);
        const body = buildDirectPostBody({ ...input, videoSize: video.size }, creator, { audited: tiktokPostingFlags().audited });
        init = await initDirectPost(accessToken, body);
      }
    } catch (error) {
      // Si TikTok rechaza los números de la subida, el mensaje dice con qué tamaño y partes se pidió.
      if (error instanceof Error && /invalid_params/.test(error.message)) {
        const plan = planChunks(video.size);
        throw new Error(`${error.message} [video_size=${video.size}, chunk_size=${plan.chunkSize}, total_chunk_count=${plan.totalChunkCount}]`);
      }
      throw error;
    }
    await uploadVideoChunks(init.uploadUrl, video.size, video.contentType, video.readRange);
    return NextResponse.json({ ok: true, publishId: init.publishId });
  } catch (error) {
    if (!(error instanceof TikTokPostingError)) console.error("Publicar en TikTok:", error);
    return postingErrorResponse(t, account, error);
  }
}
