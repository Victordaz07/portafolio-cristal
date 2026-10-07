"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/admin/Card";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { useToast } from "@/components/admin/ToastContext";
import { useT } from "@/components/admin/AdminLang";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/admin-ui";
import { PRODUCT_KINDS, formatPrice } from "@/lib/shop";
import { parseAmount } from "@/lib/income";

interface Product {
  id: string;
  kind: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  priceCents: number | null;
  currency: string;
  imageUrl: string;
  buyUrl: string;
  active: boolean;
  clicks: number;
}

const label = "flex flex-col gap-sp-1 text-xs font-medium text-ink";
const eyebrow = "mb-sp-3 font-mono text-[11px] uppercase tracking-[0.16em] text-coral";

const empty = { kind: "digital", title: "", titleEn: "", description: "", descriptionEn: "", price: "", currency: "USD", imageUrl: "", buyUrl: "" };

export default function ProductManager({ products }: { products: Product[] }) {
  const { t, lang } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const set = <K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const kind = PRODUCT_KINDS.find((k) => k.id === form.kind) ?? PRODUCT_KINDS[0];

  async function call(url: string, method: string, body?: object) {
    setBusy(true);
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
      return false;
    }
    router.refresh();
    return true;
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const cents = form.price.trim() ? parseAmount(form.price) : null;
    if (form.price.trim() && !cents) return showToast("error", t("Escribe un precio válido", "Enter a valid price"));
    const body = { kind: form.kind, title: form.title, titleEn: form.titleEn || null, description: form.description, descriptionEn: form.descriptionEn || null, priceCents: cents, currency: form.currency.toUpperCase(), imageUrl: form.imageUrl || null, buyUrl: form.buyUrl.trim(), active: true };
    const ok = editing ? await call(`/api/admin/products/${editing}`, "PATCH", body) : await call("/api/admin/products", "POST", body);
    if (ok) {
      showToast("success", editing ? t("Producto actualizado", "Product updated") : t("Producto creado", "Product created"));
      setForm(empty);
      setEditing(null);
    }
  }

  function edit(p: Product) {
    setEditing(p.id);
    setForm({ kind: p.kind, title: p.title, titleEn: p.titleEn, description: p.description, descriptionEn: p.descriptionEn, price: p.priceCents ? String(p.priceCents / 100) : "", currency: p.currency, imageUrl: p.imageUrl, buyUrl: p.buyUrl });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <Card>
        <p className={eyebrow}>{editing ? t("Editar producto", "Edit product") : t("Nuevo producto", "New product")}</p>
        <form onSubmit={save} className="grid gap-sp-3 sm:grid-cols-2">
          <label className={label}>
            {t("Tipo", "Type")}
            <select value={form.kind} onChange={(e) => set("kind", e.target.value)} className={inputClass}>
              {PRODUCT_KINDS.map((k) => (
                <option key={k.id} value={k.id}>{lang === "en" ? k.labelEn : k.label}</option>
              ))}
            </select>
            <span className="font-normal text-ink/55">{lang === "en" ? kind.hintEn : kind.hint}</span>
          </label>
          <div className="grid grid-cols-[1fr_5rem] gap-sp-2">
            <label className={label}>
              {form.kind === "affiliate" ? t("Precio (opcional)", "Price (optional)") : t("Precio", "Price")}
              <input inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="29" className={inputClass} />
            </label>
            <label className={label}>
              {t("Moneda", "Currency")}
              <input maxLength={3} value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} className={inputClass} />
            </label>
          </div>
          <label className={label}>{t("Nombre", "Name")}<input required maxLength={120} value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass} /></label>
          <label className={label}>{t("Nombre en inglés (opcional)", "Name in English (optional)")}<input maxLength={120} value={form.titleEn} onChange={(e) => set("titleEn", e.target.value)} className={inputClass} /></label>
          <label className={label}>{t("Descripción corta", "Short description")}<textarea rows={3} maxLength={600} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputClass} /></label>
          <label className={label}>{t("Descripción en inglés (opcional)", "Description in English (optional)")}<textarea rows={3} maxLength={600} value={form.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} className={inputClass} /></label>
          <label className={`${label} sm:col-span-2`}>
            {t("Enlace de pago o de la oferta", "Payment or offer link")}
            <input required type="url" value={form.buyUrl} onChange={(e) => set("buyUrl", e.target.value)} placeholder="https://" className={inputClass} />
            <span className="font-normal text-ink/55">{t("Debe empezar con https://. Aquí es donde tu cliente paga: Foliocrew no toca el dinero.", "It must start with https://. This is where your customer pays: Foliocrew never touches the money.")}</span>
          </label>
          <div className="sm:col-span-2">
            <ImageUploadField label={t("Imagen (opcional)", "Image (optional)")} value={form.imageUrl} onChange={(url) => set("imageUrl", url)} aspect={4 / 3} />
          </div>
          <div className="flex gap-sp-2 sm:col-span-2">
            <button type="submit" disabled={busy || !form.title.trim() || !form.buyUrl.trim()} className={primaryButtonClass}>{editing ? t("Guardar cambios", "Save changes") : t("Crear producto", "Create product")}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className={secondaryButtonClass}>{t("Cancelar", "Cancel")}</button>}
          </div>
        </form>
      </Card>

      <Card>
        <p className={eyebrow}>{t("Tus productos", "Your products")}</p>
        {products.length === 0 ? (
          <p className="text-sm text-ink/60">{t("Todavía no tienes productos. Crea el primero arriba.", "You don't have any products yet. Create the first one above.")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {products.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-sp-3 py-sp-3 text-sm">
                <span className="min-w-0">
                  <span className={`block truncate font-semibold ${p.active ? "text-ink" : "text-ink/40 line-through"}`}>{p.title}</span>
                  <span className="text-xs text-ink/60">
                    {PRODUCT_KINDS.find((k) => k.id === p.kind)?.[lang === "en" ? "labelEn" : "label"]}
                    {formatPrice(p.priceCents, p.currency, lang) ? ` · ${formatPrice(p.priceCents, p.currency, lang)}` : ""} · {t(`${p.clicks} clics`, `${p.clicks} clicks`)}
                    {!p.active ? ` · ${t("oculto", "hidden")}` : ""}
                  </span>
                </span>
                <span className="flex gap-sp-3 text-xs">
                  <button type="button" onClick={() => edit(p)} className="font-semibold text-coral hover:underline">{t("Editar", "Edit")}</button>
                  <button type="button" disabled={busy} onClick={() => call(`/api/admin/products/${p.id}`, "PATCH", { active: !p.active })} className="font-semibold text-cobalt hover:underline">{p.active ? t("Ocultar", "Hide") : t("Mostrar", "Show")}</button>
                  <button type="button" disabled={busy} onClick={() => window.confirm(t("¿Borrar este producto?", "Delete this product?")) && call(`/api/admin/products/${p.id}`, "DELETE")} className="text-red-600/70 hover:text-red-600">{t("Borrar", "Delete")}</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
