"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { pickLabel } from "@/lib/admin-lang";
import { formatMoney } from "@/lib/crm";
import { formatCompact } from "@/lib/metrics";
import { NICHES } from "@/lib/onboarding";
import {
  BENCHMARK_ER,
  EXCLUSIVITY_OPTIONS,
  RATE_FORMATS,
  RATE_PLATFORMS,
  USAGE_OPTIONS,
  calculateRate,
  type RatePlatform,
  type RateStep,
} from "@/lib/rates";

type PlatformData = { platform: Exclude<RatePlatform, "ugc">; followers: number | null; medianViews: number | null; medianEr: number | null; posts: number };
type Context = {
  platforms: PlatformData[];
  nicheEr: Record<string, number | null> | null;
  nicheDeal: { median: number; deals: number; niche: string } | null;
  sharesInsights: boolean;
};

/**
 * "¿Cuánto cobro?": sugiere un rango de precio para un trato. Usa los seguidores, vistas y engagement
 * que Foliocrew ya sincroniza (se pueden cambiar a mano). Con `onUse`, llena el valor del trato.
 */
export default function RateCalculator({
  onUse,
  label,
  className,
}: {
  onUse?: (value: number, summary: string, terms: { usageDays: number; exclusivityDays: number; whitelisting: boolean }) => void;
  label?: string;
  className?: string;
}) {
  const { t, lang } = useT();
  const [open, setOpen] = useState(false);
  const [ctx, setCtx] = useState<Context | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [platform, setPlatform] = useState<RatePlatform>("instagram");
  const [format, setFormat] = useState("reel");
  const [quantity, setQuantity] = useState("1");
  const [followers, setFollowers] = useState("");
  const [views, setViews] = useState("");
  const [usageDays, setUsageDays] = useState(0);
  const [exclusivityDays, setExclusivityDays] = useState(0);
  const [whitelisting, setWhitelisting] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    fetch("/api/admin/rates")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Context | null) => {
        if (!data) return;
        setCtx(data);
        // Empieza por la red con más seguidores.
        const best = [...data.platforms].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0))[0];
        if (best?.followers) choosePlatform(best.platform, data);
        else choosePlatform("instagram", data);
      })
      .catch(() => null)
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function choosePlatform(p: RatePlatform, data = ctx) {
    setPlatform(p);
    setFormat(RATE_FORMATS[p][0].id);
    const d = data?.platforms.find((x) => x.platform === p);
    setFollowers(d?.followers ? String(d.followers) : "");
    setViews(d?.medianViews ? String(Math.round(d.medianViews)) : "");
  }

  const data = ctx?.platforms.find((x) => x.platform === platform);
  const nicheEr = platform !== "ugc" ? (ctx?.nicheEr?.[platform] ?? null) : null;
  const referenceEr = platform !== "ugc" ? (nicheEr ?? BENCHMARK_ER[platform]) : null;
  const result = useMemo(
    () =>
      calculateRate({
        platform,
        format,
        quantity: Number(quantity) || 1,
        followers: Number(followers) || null,
        medianViews: Number(views) || null,
        creatorEr: data?.medianEr ?? null,
        nicheEr,
        usageDays,
        exclusivityDays,
        whitelisting,
      }),
    [platform, format, quantity, followers, views, data?.medianEr, nicheEr, usageDays, exclusivityDays, whitelisting]
  );
  const formatInfo = RATE_FORMATS[platform].find((f) => f.id === format) ?? RATE_FORMATS[platform][0];
  const days = (d: number) => (d === 365 ? t("1 año", "1 year") : t(`${d} días`, `${d} days`));
  const pct = (factor: number) => `${factor > 1 ? "+" : "−"}${Math.round(Math.abs(factor - 1) * 100)}%`;
  const showViews = platform === "tiktok" || platform === "youtube";
  const nicheName = ctx?.nicheDeal ? pickLabel(lang, NICHES.find((n) => n.id === ctx.nicheDeal!.niche) ?? { label: "", labelEn: "" }) : "";

  function stepText(s: RateStep) {
    switch (s.id) {
      case "base":
        if (platform === "ugc") return t(`Base: ${formatMoney(s.amount!)} por pieza UGC`, `Base: ${formatMoney(s.amount!)} per UGC piece`);
        if (result.audienceSource === "none") return t(`Mínimo por pieza: ${formatMoney(s.amount!)} (agrega tus seguidores)`, `Minimum per piece: ${formatMoney(s.amount!)} (add your followers)`);
        return t(
          `Base: ${formatMoney(s.amount!)} por pieza (${formatCompact(result.audience)} ${result.audienceSource === "views" ? "vistas" : "seguidores"} × $${formatInfo.per1k} por cada 1,000)`,
          `Base: ${formatMoney(s.amount!)} per piece (${formatCompact(result.audience)} ${result.audienceSource === "views" ? "views" : "followers"} × $${formatInfo.per1k} per 1,000)`
        );
      case "engagement":
        return t(
          `Tu interacción (${data?.medianEr}%) vs. ${nicheEr != null ? "tu nicho" : "lo normal en la red"} (${referenceEr}%): ×${s.factor}`,
          `Your engagement (${data?.medianEr}%) vs. ${nicheEr != null ? "your niche" : "the platform norm"} (${referenceEr}%): ×${s.factor}`
        );
      case "bundle":
        return t(`Paquete de ${quantity} piezas: ${pct(s.factor)}`, `Bundle of ${quantity} pieces: ${pct(s.factor)}`);
      case "usage":
        return t(`Derechos de uso por ${days(usageDays)}: ${pct(s.factor)}`, `Usage rights for ${days(usageDays)}: ${pct(s.factor)}`);
      case "exclusivity":
        return t(`Exclusividad por ${days(exclusivityDays)}: ${pct(s.factor)}`, `Exclusivity for ${days(exclusivityDays)}: ${pct(s.factor)}`);
      case "whitelisting":
        return t(`Spark Ads / whitelisting: ${pct(s.factor)}`, `Spark Ads / whitelisting: ${pct(s.factor)}`);
    }
  }

  function summary() {
    const q = Number(quantity) || 1;
    const what = `${q} × ${pickLabel(lang, formatInfo)}${platform !== "ugc" ? ` ${t("de", "on")} ${pickLabel(lang, RATE_PLATFORMS.find((p) => p.id === platform)!)}` : " UGC"}`;
    const extras = [
      usageDays ? t(`derechos de uso ${days(usageDays)}`, `usage rights ${days(usageDays)}`) : "",
      exclusivityDays ? t(`exclusividad ${days(exclusivityDays)}`, `exclusivity ${days(exclusivityDays)}`) : "",
      whitelisting ? "whitelisting" : "",
    ].filter(Boolean);
    return [what, ...extras].join(" · ");
  }

  const field = "flex flex-col gap-sp-1 text-sm font-medium text-ink";
  const hint = "text-xs font-normal text-ink/50";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className ?? "text-sm font-semibold text-coral hover:underline"}>
        {label ?? t("💰 ¿Cuánto cobro?", "💰 What should I charge?")}
      </button>
      {open &&
        createPortal(
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[90] overflow-y-auto bg-ink/60 px-sp-3 py-sp-6" onClick={() => setOpen(false)}>
          <div className="mx-auto w-full max-w-2xl rounded-[18px] bg-white p-sp-4 sm:p-sp-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-sp-3">
              <div>
                <h3 className="font-fraunces text-2xl font-semibold text-ink">{t("¿Cuánto cobro?", "What should I charge?")}</h3>
                <p className="mt-1 text-sm text-ink/60">
                  {t("Un rango de referencia con tus números. Tú decides el precio final.", "A reference range based on your numbers. You decide the final price.")}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t("Cerrar", "Close")} className="text-xl leading-none text-ink/40 hover:text-ink">
                ×
              </button>
            </div>

            {!loaded ? (
              <p className="py-sp-6 text-center text-sm text-ink/55">{t("Cargando tus datos…", "Loading your data…")}</p>
            ) : (
              <>
            <div className="mt-sp-4 flex flex-wrap gap-sp-2">
              {RATE_PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => choosePlatform(p.id)}
                  aria-pressed={platform === p.id}
                  className={`rounded-full px-sp-3 py-1 text-xs font-semibold transition ${platform === p.id ? "bg-ink text-cream" : "border border-line bg-white text-ink/70 hover:border-coral"}`}
                >
                  {p.id === "ugc" ? "UGC" : pickLabel(lang, p)}
                </button>
              ))}
            </div>
            {platform === "ugc" && <p className="mt-sp-2 text-xs text-ink/55">{t("Contenido que la marca publica en sus cuentas o anuncios, no en la tuya.", "Content the brand posts on its own accounts or ads, not yours.")}</p>}

            <div className="mt-sp-4 grid gap-sp-3 sm:grid-cols-2">
              <label className={field}>
                {t("Formato", "Format")}
                <select value={format} onChange={(e) => setFormat(e.target.value)} className={inputClass}>
                  {RATE_FORMATS[platform].map((f) => (
                    <option key={f.id} value={f.id}>
                      {pickLabel(lang, f)}
                    </option>
                  ))}
                </select>
              </label>
              <label className={field}>
                {t("Cantidad de piezas", "Number of pieces")}
                <input type="number" min={1} max={50} value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
              </label>
              {platform !== "ugc" && (
                <label className={field}>
                  {t("Seguidores", "Followers")}
                  <input type="number" min={0} value={followers} onChange={(e) => setFollowers(e.target.value)} className={inputClass} placeholder="10000" />
                  <span className={hint}>{data?.followers ? t("De tu cuenta conectada (puedes cambiarlo).", "From your connected account (you can change it).") : t("Escríbelo a mano o conecta la red.", "Type it in or connect the network.")}</span>
                </label>
              )}
              {showViews && (
                <label className={field}>
                  {t("Vistas típicas por video", "Typical views per video")}
                  <input type="number" min={0} value={views} onChange={(e) => setViews(e.target.value)} className={inputClass} placeholder="25000" />
                  <span className={hint}>
                    {data?.posts ? t(`Mediana de tus últimos ${data.posts} videos.`, `Median of your last ${data.posts} videos.`) : t("En esta red cuentan más que los seguidores.", "On this network they matter more than followers.")}
                  </span>
                </label>
              )}
              <label className={field}>
                {t("Derechos de uso", "Usage rights")}
                <select value={usageDays} onChange={(e) => setUsageDays(Number(e.target.value))} className={inputClass}>
                  {USAGE_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d === 0 ? t("No incluye", "Not included") : days(d)}
                    </option>
                  ))}
                </select>
                <span className={hint}>{t("Tiempo que la marca puede usar tu contenido en sus anuncios o redes.", "How long the brand can use your content in its ads or channels.")}</span>
              </label>
              <label className={field}>
                {t("Exclusividad", "Exclusivity")}
                <select value={exclusivityDays} onChange={(e) => setExclusivityDays(Number(e.target.value))} className={inputClass}>
                  {EXCLUSIVITY_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d === 0 ? t("No incluye", "Not included") : days(d)}
                    </option>
                  ))}
                </select>
                <span className={hint}>{t("Tiempo sin trabajar con la competencia.", "Time without working with competitors.")}</span>
              </label>
            </div>
            <label className="mt-sp-3 flex items-start gap-sp-2 text-sm text-ink/80">
              <input type="checkbox" checked={whitelisting} onChange={(e) => setWhitelisting(e.target.checked)} className="mt-1" />
              <span>
                {t("Spark Ads / whitelisting", "Spark Ads / whitelisting")}
                <span className="block text-xs text-ink/50">{t("La marca pauta anuncios desde tu cuenta.", "The brand runs ads from your account.")}</span>
              </span>
            </label>

            <div className="mt-sp-5 rounded-[16px] bg-cream p-sp-4">
              <div className="grid grid-cols-3 items-end gap-sp-2 text-center">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-ink/50">{t("Bajo", "Low")}</p>
                  <p className="text-lg font-semibold text-ink/70">{formatMoney(result.low)}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-coral">{t("Justo", "Fair")}</p>
                  <p className="font-fraunces text-3xl font-semibold text-ink sm:text-4xl">{formatMoney(result.fair)}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-ink/50">{t("Alto", "High")}</p>
                  <p className="text-lg font-semibold text-ink/70">{formatMoney(result.high)}</p>
                </div>
              </div>
              {(Number(quantity) || 1) > 1 && (
                <p className="mt-1 text-center text-xs text-ink/55">
                  ≈ {formatMoney(result.perPiece)} {t("por pieza", "per piece")}
                </p>
              )}
              <ul className="mt-sp-3 flex flex-col gap-1 border-t border-line pt-sp-3 text-xs text-ink/70">
                {result.steps.map((s) => (
                  <li key={s.id}>• {stepText(s)}</li>
                ))}
              </ul>
              {ctx?.nicheDeal && (
                <p className="mt-sp-3 text-xs font-semibold text-moss">
                  {t(
                    `📊 Creadores de ${nicheName} cobraron en promedio ${formatMoney(Math.round(ctx.nicheDeal.median))} por trato (${ctx.nicheDeal.deals} tratos).`,
                    `📊 ${nicheName} creators charged ${formatMoney(Math.round(ctx.nicheDeal.median))} per deal on average (${ctx.nicheDeal.deals} deals).`
                  )}
                </p>
              )}
              {ctx && !ctx.sharesInsights && platform !== "ugc" && (
                <p className="mt-sp-3 text-xs text-ink/55">
                  {t(
                    "💡 Activa la Inteligencia Foliocrew en Mi cuenta para comparar tu interacción con la de tu nicho.",
                    "💡 Turn on Foliocrew Intelligence in My account to compare your engagement with your niche."
                  )}
                </p>
              )}
            </div>
            <p className="mt-sp-3 text-[11px] text-ink/45">
              {t(
                "Referencias de mercado 2026. Empieza a negociar desde el precio justo o el alto: es más fácil bajar que subir.",
                "2026 market references. Start negotiating from the fair or high price: it's easier to go down than up."
              )}
            </p>

              </>
            )}

            <div className="mt-sp-4 flex flex-wrap justify-end gap-sp-2">
              <button type="button" onClick={() => setOpen(false)} className={secondaryButtonClass}>
                {t("Cerrar", "Close")}
              </button>
              {onUse && loaded && (
                <button
                  type="button"
                  onClick={() => {
                    onUse(result.fair, summary(), { usageDays, exclusivityDays, whitelisting });
                    setOpen(false);
                  }}
                  className={primaryButtonClass}
                >
                  {t(`Usar ${formatMoney(result.fair)}`, `Use ${formatMoney(result.fair)}`)}
                </button>
              )}
            </div>
          </div>
        </div>,
          document.body
        )}
    </>
  );
}
