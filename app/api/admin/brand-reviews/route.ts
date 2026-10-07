import { NextResponse } from "next/server";
import { z } from "zod";
import { getT } from "@/lib/admin-lang-server";
import { MAX_COMMENT } from "@/lib/brand-reviews";
import { deleteMyReview, submitReview } from "@/lib/brand-reviews-server";

export const dynamic = "force-dynamic";

const schema = z.object({
  brandId: z.string().min(1).max(60),
  payment: z.string().max(20),
  payDays: z.number().int().min(0).max(365).nullable().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(MAX_COMMENT).optional(),
});

/** Escribe o corrige tu reseña de una marca con la que trabajaste. Es anónima para las demás cuentas. */
export async function POST(request: Request) {
  const { t } = await getT();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Revisa los datos de la reseña", "Check the review details") }, { status: 400 });
  const { brandId, ...input } = parsed.data;
  const result = await submitReview(brandId, input);
  if (result.ok) return NextResponse.json({ ok: true });
  const errors: Record<string, [string, string]> = {
    brand: ["Solo puedes reseñar marcas con las que tienes un trato activo o completado", "You can only review brands you have an active or completed deal with"],
    cap: ["Llegaste al máximo de reseñas por hoy", "You've reached today's review limit"],
    contact: ["Quita correos, teléfonos y enlaces del comentario: cuenta solo lo que pasó en el trato", "Remove emails, phone numbers and links from the comment: only describe what happened in the deal"],
    email: ["Verifica tu correo para poder reseñar marcas", "Verify your email to review brands"],
    age: ["Tu cuenta es muy nueva: podrás reseñar marcas después de unos días", "Your account is very new: you'll be able to review brands after a few days"],
    inactive: ["Tu cuenta no está activa", "Your account isn't active"],
    muted: ["Tu cuenta está pausada por moderación", "Your account is paused by moderation"],
  };
  const key = result.error === "invalid" && result.reason === "contact" ? "contact" : result.error === "eligibility" ? (result.reason ?? "inactive") : result.error === "invalid" ? "" : result.error;
  const pair = errors[key];
  return NextResponse.json({ error: pair ? t(pair[0], pair[1]) : t("Revisa los datos de la reseña", "Check the review details") }, { status: result.error === "eligibility" ? 403 : 400 });
}

/** Borra tu reseña de una marca. */
export async function DELETE(request: Request) {
  const { t } = await getT();
  const key = new URL(request.url).searchParams.get("brandKey") ?? "";
  if (!key || !(await deleteMyReview(key))) return NextResponse.json({ error: t("No se encontró tu reseña", "Couldn't find your review") }, { status: 404 });
  return NextResponse.json({ ok: true });
}
