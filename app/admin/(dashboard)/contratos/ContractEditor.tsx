"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { pickLabel } from "@/lib/admin-lang";
import { CONTRACT_TEMPLATES, contractToText, generateContract, type ContractParties, type ContractTemplate, type ContractTerms } from "@/lib/contracts";
import ContractDocument from "@/components/contract/ContractDocument";

export type EditorState = { brandId: string; language: "es" | "en"; terms: ContractTerms; parties: ContractParties };

const CURRENCIES = ["USD", "MXN", "EUR", "COP", "ARS", "CLP", "PEN", "DOP"];
const DAY_CHOICES = [0, 30, 60, 90, 180, 365];

/** Crear un contrato o editar un borrador, con la vista previa del texto en vivo. */
export default function ContractEditor({ contractId, initial, brands }: { contractId?: string; initial: EditorState; brands: { id: string; name: string }[] }) {
  const { t, lang } = useT();
  const router = useRouter();
  const { showToast } = useToast();
  const [s, setS] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [feeText, setFeeText] = useState(initial.terms.fee ? String(initial.terms.fee / 100) : "");
  const [items, setItems] = useState(initial.terms.deliverables.join("\n"));

  const terms: ContractTerms = useMemo(
    () => ({ ...s.terms, deliverables: items.split("\n").map((l) => l.trim()).filter(Boolean), fee: Math.round((Number(feeText.replace(/,/g, "")) || 0) * 100) }),
    [s.terms, items, feeText]
  );
  const preview = useMemo(() => contractToText(generateContract(terms, s.parties, s.language)), [terms, s.parties, s.language]);

  const setTerm = <K extends keyof ContractTerms>(key: K, value: ContractTerms[K]) => setS((cur) => ({ ...cur, terms: { ...cur.terms, [key]: value } }));
  const setParty = (who: "creator" | "brand", key: string, value: string) => setS((cur) => ({ ...cur, parties: { ...cur.parties, [who]: { ...cur.parties[who], [key]: value } } }));
  const tpl = s.terms.template;
  const num = (key: keyof ContractTerms) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setTerm(key, (Number(e.target.value) || 0) as never);
  const days = (n: number) => (n === 0 ? t("No incluye", "Not included") : n === 365 ? t("1 año", "1 year") : t(`${n} días`, `${n} days`));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(contractId ? `/api/admin/contracts/${contractId}` : "/api/admin/contracts", {
      method: contractId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId: s.brandId || null, language: s.language, terms, parties: s.parties }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; id?: string };
    setSaving(false);
    if (!response.ok) return showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
    showToast("success", t("Acuerdo guardado", "Agreement saved"));
    if (!contractId && data.id) router.push(`/admin/contratos/${data.id}`);
    else router.refresh();
  }

  const label = "flex flex-col gap-sp-1 text-sm font-medium text-ink";
  const hint = "text-xs font-normal text-ink/50";
  const group = "grid gap-sp-4 sm:grid-cols-2";
  const legend = "font-mono text-[11px] uppercase tracking-[0.16em] text-coral";

  return (
    <div className="grid gap-sp-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form onSubmit={save} className="flex min-w-0 flex-col gap-sp-5">
        <div className={group}>
          <label className={label}>
            {t("Plantilla", "Template")}
            <select value={tpl} onChange={(e) => setTerm("template", e.target.value as ContractTemplate)} className={inputClass}>
              {CONTRACT_TEMPLATES.map((x) => (
                <option key={x.id} value={x.id}>
                  {pickLabel(lang, x)}
                </option>
              ))}
            </select>
            <span className={hint}>{pickLabel(lang, { label: CONTRACT_TEMPLATES.find((x) => x.id === tpl)!.hint, labelEn: CONTRACT_TEMPLATES.find((x) => x.id === tpl)!.hintEn })}</span>
          </label>
          <label className={label}>
            {t("Idioma del acuerdo", "Agreement language")}
            <select value={s.language} onChange={(e) => setS((cur) => ({ ...cur, language: e.target.value as "es" | "en" }))} className={inputClass}>
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className={`${label} sm:col-span-2`}>
            {t("Trato", "Deal")}
            <select value={s.brandId} onChange={(e) => setS((cur) => ({ ...cur, brandId: e.target.value }))} className={inputClass}>
              <option value="">{t("Sin trato", "No deal")}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <span className={hint}>{t("Cuando la marca lo acepte, el trato pasa a «Activo».", "When the brand accepts it, the deal becomes “Active”.")}</span>
          </label>
        </div>

        <fieldset className="flex flex-col gap-sp-3 rounded-[14px] border border-line bg-cream/60 p-sp-4">
          <legend className={`px-sp-1 ${legend}`}>{t("Las partes", "The parties")}</legend>
          <div className={group}>
            <label className={label}>
              {t("Tu nombre", "Your name")}
              <input value={s.parties.creator.name} onChange={(e) => setParty("creator", "name", e.target.value)} className={inputClass} maxLength={200} />
            </label>
            <label className={label}>
              {t("Tu ciudad y país", "Your city and country")}
              <input value={s.parties.creator.location ?? ""} onChange={(e) => setParty("creator", "location", e.target.value)} className={inputClass} maxLength={200} />
            </label>
            <label className={label}>
              {t("Empresa o marca", "Company or brand")}
              <input value={s.parties.brand.company ?? ""} onChange={(e) => setParty("brand", "company", e.target.value)} className={inputClass} maxLength={200} />
            </label>
            <label className={label}>
              {t("Persona de contacto", "Contact person")}
              <input value={s.parties.brand.name} onChange={(e) => setParty("brand", "name", e.target.value)} className={inputClass} maxLength={200} />
            </label>
            <label className={`${label} sm:col-span-2`}>
              {t("Correo de la marca (para enviarlo)", "Brand's email (to send it)")}
              <input type="email" value={s.parties.brand.email ?? ""} onChange={(e) => setParty("brand", "email", e.target.value)} className={inputClass} placeholder="ana@marca.com" />
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-sp-3">
          <legend className={legend}>{tpl === "affiliate" ? t("Qué vas a hacer", "What you'll do") : t("Qué se entrega", "What's delivered")}</legend>
          <label className={label}>
            {tpl === "ambassador" ? t("Entregables de cada mes (uno por línea)", "Each month's deliverables (one per line)") : t("Entregables (uno por línea)", "Deliverables (one per line)")}
            <textarea rows={4} value={items} onChange={(e) => setItems(e.target.value)} className={inputClass} placeholder={t("2 reels de Instagram\n3 historias", "2 Instagram reels\n3 stories")} />
          </label>
          {tpl !== "affiliate" && (
            <label className={label}>
              {t("Fecha de entrega", "Delivery date")}
              <input type="date" value={s.terms.deliveryDate} onChange={(e) => setTerm("deliveryDate", e.target.value)} className={inputClass} />
            </label>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-sp-3">
          <legend className={legend}>{t("Pago", "Payment")}</legend>
          <div className={group}>
            {tpl === "affiliate" ? (
              <label className={label}>
                {t("Comisión sobre ventas (%)", "Commission on sales (%)")}
                <input type="number" min={0} max={100} step="any" value={s.terms.commissionPercent} onChange={num("commissionPercent")} className={inputClass} />
              </label>
            ) : null}
            <label className={label}>
              {tpl === "ambassador" ? t("Pago por mes", "Fee per month") : tpl === "affiliate" ? t("Monto fijo (opcional)", "Fixed amount (optional)") : t("Monto total", "Total amount")}
              <input inputMode="decimal" value={feeText} onChange={(e) => setFeeText(e.target.value)} className={inputClass} placeholder="1000" />
              <span className={hint}>{t("En la moneda de abajo. Puedes usar «¿Cuánto cobro?» en Marcas.", "In the currency below. You can use “What should I charge?” in Brands.")}</span>
            </label>
            <label className={label}>
              {t("Moneda", "Currency")}
              <select value={s.terms.currency} onChange={(e) => setTerm("currency", e.target.value)} className={inputClass}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            {tpl === "ambassador" && (
              <label className={label}>
                {t("Duración (meses)", "Duration (months)")}
                <input type="number" min={1} max={36} value={s.terms.months} onChange={num("months")} className={inputClass} />
              </label>
            )}
            {(tpl === "sponsored" || tpl === "ugc") && (
              <label className={label}>
                {t("Anticipo (%)", "Deposit (%)")}
                <input type="number" min={0} max={100} value={s.terms.depositPercent} onChange={num("depositPercent")} className={inputClass} />
              </label>
            )}
            <label className={label}>
              {t("Días para pagar la factura", "Days to pay the invoice")}
              <input type="number" min={0} max={180} value={s.terms.paymentDays} onChange={num("paymentDays")} className={inputClass} />
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-sp-3">
          <legend className={legend}>{t("Uso del contenido y condiciones", "Content use and terms")}</legend>
          <div className={group}>
            {tpl !== "affiliate" && (
              <label className={label}>
                {t("Derechos de uso", "Usage rights")}
                <select value={s.terms.usageDays} onChange={num("usageDays")} className={inputClass}>
                  {DAY_CHOICES.map((d) => (
                    <option key={d} value={d}>
                      {days(d)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className={label}>
              {t("Exclusividad", "Exclusivity")}
              <select value={s.terms.exclusivityDays} onChange={num("exclusivityDays")} className={inputClass}>
                {DAY_CHOICES.map((d) => (
                  <option key={d} value={d}>
                    {days(d)}
                  </option>
                ))}
              </select>
            </label>
            {s.terms.exclusivityDays > 0 && (
              <label className={label}>
                {t("¿Con qué categoría?", "Which category?")}
                <input value={s.terms.exclusivityCategory} onChange={(e) => setTerm("exclusivityCategory", e.target.value)} className={inputClass} maxLength={120} placeholder="skincare" />
              </label>
            )}
            {tpl !== "affiliate" && (
              <label className={label}>
                {t("Rondas de cambios incluidas", "Rounds of changes included")}
                <input type="number" min={0} max={10} value={s.terms.revisions} onChange={num("revisions")} className={inputClass} />
              </label>
            )}
            <label className={label}>
              {t("Días de aviso para cancelar", "Days' notice to cancel")}
              <input type="number" min={0} max={180} value={s.terms.cancelNoticeDays} onChange={num("cancelNoticeDays")} className={inputClass} />
            </label>
            {tpl !== "affiliate" && (
              <label className={label}>
                {t("Cargo si la marca cancela (%)", "Fee if the brand cancels (%)")}
                <input type="number" min={0} max={100} value={s.terms.killFeePercent} onChange={num("killFeePercent")} className={inputClass} />
                <span className={hint}>{t("Sobre el monto total. 0 = ninguno.", "On the total amount. 0 = none.")}</span>
              </label>
            )}
          </div>
          {(tpl === "sponsored" || tpl === "ambassador" || tpl === "affiliate") && (
            <label className="flex items-start gap-sp-2 text-sm text-ink">
              <input type="checkbox" checked={s.terms.whitelisting} onChange={(e) => setTerm("whitelisting", e.target.checked)} className="mt-1" />
              <span>
                {t("Spark Ads / whitelisting", "Spark Ads / whitelisting")}
                <span className={`block ${hint}`}>{t("La marca pauta anuncios desde tu cuenta.", "The brand runs ads from your account.")}</span>
              </span>
            </label>
          )}
          <label className={label}>
            {t("Condiciones adicionales (opcional)", "Additional terms (optional)")}
            <textarea rows={3} value={s.terms.extra} onChange={(e) => setTerm("extra", e.target.value)} className={inputClass} maxLength={3000} />
            <span className={hint}>{t("Un párrafo por línea. Por ejemplo, la ley que aplica.", "One paragraph per line. For example, the governing law.")}</span>
          </label>
        </fieldset>

        <div className="flex flex-wrap gap-sp-3">
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? t("Guardando…", "Saving…") : contractId ? t("Guardar cambios", "Save changes") : t("Crear borrador", "Create draft")}
          </button>
          <button type="button" onClick={() => router.push("/admin/contratos")} className={secondaryButtonClass}>
            {t("Cancelar", "Cancel")}
          </button>
        </div>
      </form>

      <div className="min-w-0 xl:sticky xl:top-sp-4 xl:max-h-[calc(100vh-2rem)] xl:self-start xl:overflow-y-auto">
        <p className={`mb-sp-2 ${legend}`}>{t("Así lo verá la marca", "How the brand will see it")}</p>
        <ContractDocument bodyText={preview} language={s.language} />
      </div>
    </div>
  );
}
