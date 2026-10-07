"use client";

import { useState } from "react";
import type { Package } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import BilingualTextField from "@/components/admin/BilingualTextField";
import { swapOrder } from "@/lib/reorder";
import { inputClass, primaryButtonClass, rowCardStartClass, cardClass, dangerLinkClass } from "@/lib/admin-ui";
import { useT } from "@/components/admin/AdminLang";

const API_BASE = "/api/admin/packages";

const EMPTY = { emoji: "✨", name: "", nameEn: "", itemsText: "", itemsTextEn: "", priceFrom: "", requestable: true };

function toItems(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function PackagesManager({ initialPackages }: { initialPackages: Package[] }) {
  const { t, lang } = useT();
  const { showToast } = useToast();
  const [packages, setPackages] = useState(initialPackages);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Package | null>(null);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const items = toItems(form.itemsText);
    if (items.length === 0) {
      showToast("error", t("Agrega al menos un ítem", "Add at least one item"));
      return;
    }

    setSaving(true);
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emoji: form.emoji,
        name: form.name,
        nameEn: form.nameEn,
        items,
        itemsEn: toItems(form.itemsTextEn),
        priceFrom: form.priceFrom.trim() ? Math.round(Number(form.priceFrom)) : null,
        requestable: form.requestable,
      }),
    });
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? t("No se pudo agregar el paquete", "Couldn't add the package"));
      return;
    }

    const created: Package = await response.json();
    setPackages((current) => [...current, created]);
    setForm(EMPTY);
    showToast("success", t("Paquete agregado", "Package added"));
  }

  async function handleDelete(pkg: Package) {
    const response = await fetch(`${API_BASE}/${pkg.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) {
      showToast("error", t("No se pudo eliminar", "Couldn't delete"));
      return;
    }
    setPackages((current) => current.filter((item) => item.id !== pkg.id));
    showToast("success", t("Paquete eliminado", "Package deleted"));
  }

  async function handleSettings(pkg: Package, data: { priceFrom: number | null; requestable: boolean }) {
    const response = await fetch(`${API_BASE}/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      showToast("error", t("No se pudo guardar", "Couldn't save"));
      return;
    }
    const updated: Package = await response.json();
    setPackages((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    showToast("success", t("Paquete actualizado", "Package updated"));
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const next = await swapOrder(packages, index, direction, API_BASE);
    setPackages(next);
  }

  return (
    <div>
      <ul className="flex flex-col gap-sp-3">
        {packages.map((pkg, index) => (
          <li key={pkg.id} className={rowCardStartClass}>
            <ReorderButtons
              onUp={() => handleMove(index, "up")}
              onDown={() => handleMove(index, "down")}
              disableUp={index === 0}
              disableDown={index === packages.length - 1}
            />
            <div className="flex-1">
              <p className="font-medium text-ink">
                {pkg.emoji} {(lang === "en" && pkg.nameEn) || pkg.name}
                {pkg.nameEn && <span className="text-ink/40"> · {pkg.nameEn}</span>}
              </p>
              <ul className="mt-sp-1 list-disc pl-sp-5 text-sm text-ink/60">
                {pkg.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
              {pkg.itemsEn.length > 0 && (
                <ul className="mt-sp-1 list-disc pl-sp-5 text-sm text-ink/40">
                  {pkg.itemsEn.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              )}
              <PackageSettings pkg={pkg} onSave={(data) => handleSettings(pkg, data)} />
            </div>
            <button
              type="button"
              onClick={() => setPendingDelete(pkg)}
              className={dangerLinkClass}
            >
              {t("Eliminar", "Delete")}
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className={`${cardClass} mt-sp-6 flex flex-col gap-sp-4 max-w-lg`}>
        <div className="grid gap-sp-4 sm:grid-cols-[80px_1fr]">
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">Emoji</span>
            <input
              value={form.emoji}
              onChange={(e) => setForm((c) => ({ ...c, emoji: e.target.value }))}
              className={inputClass}
            />
          </label>
          <BilingualTextField
            label={t("Nombre del paquete", "Package name")}
            es={form.name}
            en={form.nameEn}
            onEsChange={(v) => setForm((c) => ({ ...c, name: v }))}
            onEnChange={(v) => setForm((c) => ({ ...c, nameEn: v }))}
            required
          />
        </div>
        <BilingualTextField
          label={t("Qué incluye (un ítem por línea)", "What's included (one item per line)")}
          es={form.itemsText}
          en={form.itemsTextEn}
          onEsChange={(v) => setForm((c) => ({ ...c, itemsText: v }))}
          onEnChange={(v) => setForm((c) => ({ ...c, itemsTextEn: v }))}
          multiline
          rows={5}
          required
        />
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">{t("Precio «desde» en US$ (opcional)", "“From” price in US$ (optional)")}</span>
          <input type="number" min={0} step={1} value={form.priceFrom} onChange={(e) => setForm((c) => ({ ...c, priceFrom: e.target.value }))} className={inputClass} />
        </label>
        <label className="flex items-center gap-sp-2 text-sm text-ink">
          <input type="checkbox" checked={form.requestable} onChange={(e) => setForm((c) => ({ ...c, requestable: e.target.checked }))} />
          {t("Permitir que las marcas lo soliciten desde mi sitio", "Let brands request it from my site")}
        </label>
        <button type="submit" disabled={saving} className={`${primaryButtonClass} self-start`}>
          {saving ? t("Agregando...", "Adding...") : t("+ agregar paquete", "+ add package")}
        </button>
      </form>

      {pendingDelete && (
        <ConfirmDialog
          title={t("Eliminar paquete", "Delete package")}
          description={t(`¿Eliminar "${pendingDelete.name}"?`, `Delete "${pendingDelete.name}"?`)}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

/** Precio «desde» y solicitudes de un paquete ya creado (C2). */
function PackageSettings({ pkg, onSave }: { pkg: Package; onSave: (data: { priceFrom: number | null; requestable: boolean }) => Promise<void> }) {
  const { t } = useT();
  const [price, setPrice] = useState(pkg.priceFrom ? String(pkg.priceFrom) : "");
  const [requestable, setRequestable] = useState(pkg.requestable);
  const [busy, setBusy] = useState(false);
  const priceValue = price.trim() ? Math.round(Number(price)) : null;
  const changed = priceValue !== (pkg.priceFrom ?? null) || requestable !== pkg.requestable;
  return (
    <div className="mt-sp-3 flex flex-wrap items-center gap-sp-3 rounded-[12px] bg-cream px-sp-3 py-sp-2 text-sm text-ink">
      <label className="flex items-center gap-sp-2">
        {t("Desde US$", "From US$")}
        <input
          type="number"
          min={0}
          step={1}
          aria-label={t("Precio desde", "From price")}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-24 rounded-sm border border-line px-sp-2 py-1 outline-none focus:border-coral"
        />
      </label>
      <label className="flex items-center gap-sp-2">
        <input type="checkbox" checked={requestable} onChange={(e) => setRequestable(e.target.checked)} />
        {t("Permitir solicitudes", "Allow requests")}
      </label>
      {changed && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onSave({ priceFrom: priceValue, requestable });
            setBusy(false);
          }}
          className="rounded-full bg-ink px-sp-4 py-1 text-xs font-semibold text-cream hover:bg-coral"
        >
          {t("Guardar", "Save")}
        </button>
      )}
    </div>
  );
}
