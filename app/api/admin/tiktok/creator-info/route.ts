import { NextResponse } from "next/server";
import { getT } from "@/lib/admin-lang-server";
import { allowedPrivacyOptions, queryCreatorInfo, tiktokPostingFlags } from "@/lib/social/tiktok-posting";
import { loadPostingAccount, postingErrorResponse } from "@/lib/social/tiktok-posting-server";

export const dynamic = "force-dynamic";

/**
 * Info del creador para la pantalla «Publicar en TikTok» (TikTok exige pedirla cada vez que se abre):
 * apodo, avatar, opciones de privacidad, interacciones apagadas y duración máxima.
 */
export async function POST() {
  const { t } = await getT();
  const loaded = await loadPostingAccount(t, ["direct"]);
  if ("response" in loaded) return loaded.response;
  try {
    const creator = await queryCreatorInfo(loaded.accessToken);
    const { audited } = tiktokPostingFlags();
    return NextResponse.json({ creator, privacyOptions: allowedPrivacyOptions(creator, audited), audited });
  } catch (error) {
    return postingErrorResponse(t, loaded.account, error);
  }
}
