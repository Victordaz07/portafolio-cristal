import { NextResponse } from "next/server";
import { getT } from "@/lib/admin-lang-server";
import { getSession } from "@/lib/tenant";
import { publishPost } from "@/lib/publish-server";

export const dynamic = "force-dynamic";
// Subir un video a Instagram puede tardar: se le da margen a la función.
export const maxDuration = 60;

/** «Publicar ahora»: publica la pieza en sus redes (Instagram y Facebook) sin esperar a la hora programada. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const session = await getSession();
  if (session?.actorId) return NextResponse.json({ error: t("El equipo no publica en nombre de una cuenta", "The team doesn't publish on behalf of an account") }, { status: 403 });
  const { id } = await params;
  const outcome = await publishPost(id);
  if (!outcome.ok) {
    const errors = {
      not_found: [404, t("No se encontró la publicación o ya está publicada", "Post not found or already published")],
      busy: [409, t("Ya se está publicando; espera un momento", "It's already being published; wait a moment")],
      disabled: [400, t("La publicación automática aún no está activa para estas redes", "Automatic publishing isn't active for these networks yet")],
    } as const;
    const [status, error] = errors[outcome.error];
    return NextResponse.json({ error }, { status });
  }
  return NextResponse.json(outcome);
}
