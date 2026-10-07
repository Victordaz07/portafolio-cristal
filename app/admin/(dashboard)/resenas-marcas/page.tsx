import { currentCreatorId } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { MIN_REVIEWS, PAYMENT_OPTIONS, MIN_ACCOUNT_AGE_DAYS } from "@/lib/brand-reviews";
import { browseBrands, myReviewableBrands, reviewerEligibility } from "@/lib/brand-reviews-server";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import BrandReviewForm from "./BrandReviewForm";

export const dynamic = "force-dynamic";

const SUPPORT_MAIL = "soporte@foliocrew.pro";

export default async function BrandReviewsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { t, lang } = await getT();
  const { q = "" } = await searchParams;
  const creatorId = await currentCreatorId();
  const [brands, mine, elig] = await Promise.all([browseBrands(q.slice(0, 60)), myReviewableBrands(), reviewerEligibility(creatorId)]);
  const reasons = {
    email: t("Verifica tu correo para poder reseñar marcas.", "Verify your email to review brands."),
    age: t(`Tu cuenta es nueva: podrás reseñar marcas después de ${MIN_ACCOUNT_AGE_DAYS} días.`, `Your account is new: you'll be able to review brands after ${MIN_ACCOUNT_AGE_DAYS} days.`),
    inactive: t("Tu cuenta no está activa.", "Your account isn't active."),
    muted: t("Tu cuenta está pausada por moderación.", "Your account is paused by moderation."),
  };
  const payLabel = (id: string) => PAYMENT_OPTIONS.find((o) => o.id === id)?.[lang === "en" ? "labelEn" : "label"] ?? id;

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Negocio", "Business")}
        title={t("Reseñas de marcas", "Brand reviews")}
        description={t(
          "Lo que otras creadoras cuentan de trabajar con una marca: si paga a tiempo, cuánto tarda y cómo es el trato. Todo es anónimo.",
          "What other creators say about working with a brand: whether it pays on time, how long it takes and what the deal is like. Everything is anonymous."
        )}
      />
      <p role="note" className="rounded-[14px] border border-line bg-cream px-sp-4 py-sp-3 text-xs text-ink/70">
        {t(
          `Por privacidad, una marca solo aparece cuando tiene reseñas de al menos ${MIN_REVIEWS} creadoras distintas. Nadie ve quién escribió cada reseña. Las reseñas son sobre hechos del trato; los comentarios pasan por revisión del equipo antes de verse.`,
          `For privacy, a brand only shows up once it has reviews from at least ${MIN_REVIEWS} different creators. Nobody can see who wrote each review. Reviews are about facts of the deal; comments are reviewed by the team before they're shown.`
        )}
      </p>

      <form className="flex gap-sp-2" action="/admin/resenas-marcas">
        <input name="q" defaultValue={q} placeholder={t("Buscar una marca…", "Search for a brand…")} maxLength={60} className="w-full max-w-sm rounded-md border border-line bg-white px-sp-3 py-sp-2 text-sm outline-none focus:border-coral" />
        <button className="rounded-full border border-line px-sp-4 py-sp-2 text-sm font-medium text-ink hover:border-coral">{t("Buscar", "Search")}</button>
      </form>

      {brands.length === 0 ? (
        <Card>
          <p className="text-sm text-ink/60">
            {q
              ? t("No hay datos suficientes de esa marca todavía (o no la tenemos).", "There isn't enough data on that brand yet (or we don't have it).")
              : t("Todavía no hay marcas con suficientes reseñas. Ayuda a que aparezcan contando tu experiencia abajo.", "No brand has enough reviews yet. Help them show up by sharing your experience below.")}
          </p>
        </Card>
      ) : (
        <div className="grid gap-sp-3 lg:grid-cols-2">
          {brands.map((b) => (
            <Card key={b.key}>
              <div className="flex items-start justify-between gap-sp-3">
                <h2 className="font-fraunces text-xl font-medium italic text-ink">{b.name}</h2>
                <span className="shrink-0 rounded-full bg-lime/40 px-sp-3 py-0.5 text-xs font-semibold text-ink">★ {b.summary.avgRating?.toFixed(1)} · {t(`${b.summary.count} reseñas`, `${b.summary.count} reviews`)}</span>
              </div>
              <dl className="mt-sp-3 grid grid-cols-3 gap-sp-2 text-center text-xs">
                <div className="rounded-[12px] bg-cream p-sp-2"><dt className="text-ink/60">{payLabel("on_time")}</dt><dd className="font-fraunces text-lg font-semibold text-ink">{b.summary.onTimePct}%</dd></div>
                <div className="rounded-[12px] bg-cream p-sp-2"><dt className="text-ink/60">{payLabel("late")}</dt><dd className="font-fraunces text-lg font-semibold text-ink">{b.summary.latePct}%</dd></div>
                <div className="rounded-[12px] bg-cream p-sp-2"><dt className="text-ink/60">{payLabel("unpaid")}</dt><dd className="font-fraunces text-lg font-semibold text-ink">{b.summary.unpaidPct}%</dd></div>
              </dl>
              {b.summary.medianPayDays != null && <p className="mt-sp-2 text-sm text-ink/70">{t(`Suele pagar en unos ${b.summary.medianPayDays} días.`, `It usually pays in about ${b.summary.medianPayDays} days.`)}</p>}
              {b.summary.comments && b.summary.comments.length > 0 && (
                <ul className="mt-sp-3 flex flex-col gap-sp-2">
                  {b.summary.comments.map((c) => (
                    <li key={c} className="rounded-[10px] bg-cream px-sp-3 py-sp-2 text-xs text-ink/80">“{c}”</li>
                  ))}
                </ul>
              )}
              {b.reply && (
                <div className="mt-sp-3 rounded-[10px] border border-line px-sp-3 py-sp-2 text-xs text-ink/80">
                  <p className="font-semibold text-ink">{t("Respuesta de la marca", "Brand's reply")}</p>
                  <p className="mt-1">{b.reply}</p>
                </div>
              )}
              <p className="mt-sp-3 text-[11px] text-ink/50">
                {t("¿Eres esta marca y quieres responder o corregir algo? ", "Are you this brand and want to reply or correct something? ")}
                <a className="text-coral hover:underline" href={`mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent(`Derecho de respuesta: ${b.name}`)}`}>{t("Escríbenos", "Write to us")}</a>.
              </p>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <p className="mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Cuenta tu experiencia", "Share your experience")}</p>
        {!elig.ok ? (
          <p className="text-sm text-ink/70">{reasons[elig.reason]}</p>
        ) : mine.length === 0 ? (
          <p className="text-sm text-ink/60">{t("Aparecen aquí las marcas con las que tienes un trato activo o completado en Marcas.", "Brands with an active or completed deal in Brands show up here.")}</p>
        ) : (
          <BrandReviewForm
            brands={mine.map((b) => ({
              id: b.id,
              name: b.name,
              key: b.key,
              review: b.review ? { payment: b.review.payment, payDays: b.review.payDays, rating: b.review.rating, comment: b.review.comment, commentStatus: b.review.commentStatus } : null,
            }))}
          />
        )}
      </Card>
    </div>
  );
}
