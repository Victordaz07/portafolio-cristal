"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { BrandWithCrm } from "@/lib/brand-crm";
import { useToast } from "@/components/admin/ToastContext";
import ReorderButtons from "@/components/admin/ReorderButtons";
import Card from "@/components/admin/Card";
import Badge from "@/components/admin/Badge";
import { swapOrder } from "@/lib/reorder";
import { rowCardClass, accentLinkClass, inputClass, secondaryButtonClass } from "@/lib/admin-ui";
import {
  DEAL_STATUSES,
  DEAL_STATUS_META,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_META,
  isDealStatus,
  isPaymentStatus,
  formatMoney,
  formatShortDate,
  daysUntil,
  dueLabel,
  dateToInput,
  type DealStatus,
  type PaymentStatus,
} from "@/lib/crm";
import BrandForm, { emptyBrandForm, toBrandPayload, type BrandFormValues } from "./BrandForm";
import DeliverablesSection from "./DeliverablesSection";
import { daysFromNow, usageRightsEnd } from "@/lib/deliverables";
import { pickLabel } from "@/lib/admin-lang";
import { useT } from "@/components/admin/AdminLang";

// Las fechas llegan como string (JSON), tanto desde la página como desde la API.
type Serialized<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;
export type BrandCrm = Serialized<BrandWithCrm>;

type View = "deals" | "carousel";
type Filter = "deals" | "all" | DealStatus;

const API_BASE = "/api/admin/brands";

const PLATFORM_INITIALS: Record<string, { initials: string; className: string }> = {
  instagram: { initials: "IG", className: "bg-coral text-white" },
  tiktok: { initials: "TK", className: "bg-ink text-white" },
  facebook: { initials: "FB", className: "bg-moss text-white" },
  ugc: { initials: "📷", className: "bg-lime text-ink" },
};

const eyebrowClass = "font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55";

function toFormValues(brand: BrandCrm): BrandFormValues {
  return {
    name: brand.name,
    logoUrl: brand.logoUrl ?? "",
    websiteUrl: brand.websiteUrl ?? "",
    active: brand.active,
    dealStatus: isDealStatus(brand.dealStatus) ? brand.dealStatus : "",
    contactName: brand.contactName ?? "",
    contactEmail: brand.contactEmail ?? "",
    dealValue: brand.dealValue == null ? "" : String(brand.dealValue),
    packageDetail: brand.packageDetail ?? "",
    platforms: brand.platforms,
    nextAction: brand.nextAction ?? "",
    nextActionDue: dateToInput(brand.nextActionDue),
    lastContactAt: dateToInput(brand.lastContactAt),
    usageRightsDays: brand.usageRightsDays ? String(brand.usageRightsDays) : "",
    usageRightsStart: dateToInput(brand.usageRightsStart),
    exclusivityDays: brand.exclusivityDays ? String(brand.exclusivityDays) : "",
    exclusivityCategory: brand.exclusivityCategory ?? "",
    whitelisting: brand.whitelisting,
  };
}

function StatusBadge({ status }: { status: string | null }) {
  const { t, lang } = useT();
  if (!isDealStatus(status)) {
    return <Badge>{t("Portafolio", "Portfolio")}</Badge>;
  }
  const meta = DEAL_STATUS_META[status];
  return (
    <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${meta.className}`}>
      {pickLabel(lang, meta)}
    </span>
  );
}

function BrandLogo({ brand, size = "h-10 w-10" }: { brand: BrandCrm; size?: string }) {
  return brand.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={brand.logoUrl} alt="" className={`${size} shrink-0 rounded-md border border-line bg-white object-contain p-1`} />
  ) : (
    <span
      className={`${size} flex shrink-0 items-center justify-center rounded-md bg-cream font-bodoni italic text-ink/40`}
    >
      {brand.name.charAt(0)}
    </span>
  );
}

export default function BrandsManager({ initialBrands }: { initialBrands: BrandCrm[] }) {
  const { showToast } = useToast();
  const { t, lang } = useT();
  const [brands, setBrands] = useState(initialBrands);
  const [view, setView] = useState<View>("deals");
  const [filter, setFilter] = useState<Filter>(() =>
    initialBrands.some((b) => isDealStatus(b.dealStatus)) ? "deals" : "all"
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    () => (initialBrands.find((b) => isDealStatus(b.dealStatus)) ?? initialBrands[0])?.id ?? null
  );
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState<null | "deal" | "logo">(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const visibleBrands = useMemo(() => {
    const list = brands.filter((brand) => {
      if (filter === "all") return true;
      if (filter === "deals") return isDealStatus(brand.dealStatus);
      return brand.dealStatus === filter;
    });
    // Primero lo que tiene próximo paso más urgente; luego el resto por orden del carrusel.
    return [...list].sort((a, b) => {
      const aDue = a.nextActionDue ? new Date(a.nextActionDue).getTime() : Infinity;
      const bDue = b.nextActionDue ? new Date(b.nextActionDue).getTime() : Infinity;
      return aDue - bDue || a.order - b.order;
    });
  }, [brands, filter]);

  const selected = brands.find((brand) => brand.id === selectedId) ?? null;

  function replaceBrand(updated: BrandCrm) {
    setBrands((current) => current.map((brand) => (brand.id === updated.id ? updated : brand)));
  }

  async function request(url: string, method: string, body?: unknown) {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      showToast("error", data.error ?? t("No se pudo guardar", "Couldn't save"));
      return null;
    }
    return data as BrandCrm;
  }

  async function patchSelected(body: Record<string, unknown>, successMessage: string) {
    if (!selected) return false;
    const updated = await request(`${API_BASE}/${selected.id}`, "PATCH", body);
    if (!updated) return false;
    replaceBrand(updated);
    showToast("success", successMessage);
    return true;
  }

  async function handleCreate(values: BrandFormValues) {
    const created = await request(API_BASE, "POST", toBrandPayload(values));
    if (!created) return;
    setBrands((current) => [...current, created]);
    setCreating(null);
    if (isDealStatus(created.dealStatus)) {
      setView("deals");
      if (filter !== "all" && filter !== "deals" && filter !== created.dealStatus) setFilter("deals");
    }
    setSelectedId(created.id);
    showToast("success", t("Marca agregada", "Brand added"));
  }

  async function handleUpdate(values: BrandFormValues) {
    if (await patchSelected(toBrandPayload(values), t("Marca actualizada", "Brand updated"))) setEditing(false);
  }

  async function handleToggleActive(brand: BrandCrm) {
    const updated = brand.active
      ? await request(`${API_BASE}/${brand.id}`, "DELETE")
      : await request(`${API_BASE}/${brand.id}`, "PATCH", { active: true });
    if (!updated) return;
    replaceBrand(updated);
    showToast("success", updated.active ? t("Visible en el carrusel", "Visible in the carousel") : t("Oculta del carrusel", "Hidden from the carousel"));
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const next = await swapOrder(brands, index, direction, API_BASE);
    setBrands(next);
  }

  const filterChips: { id: Filter; label: string; count: number }[] = [
    { id: "deals", label: t("En trato", "In deals"), count: brands.filter((b) => isDealStatus(b.dealStatus)).length },
    ...DEAL_STATUSES.map((status) => ({
      id: status,
      label: pickLabel(lang, DEAL_STATUS_META[status]),
      count: brands.filter((b) => b.dealStatus === status).length,
    })),
    { id: "all", label: t("Todas", "All"), count: brands.length },
  ];

  return (
    <div>
      <div className="mb-sp-5 flex flex-wrap items-center justify-between gap-sp-3">
        <div className="inline-flex rounded-full border border-line bg-white p-1">
          {(
            [
              { id: "deals", label: t("Tratos", "Deals") },
              { id: "carousel", label: t("Carrusel del sitio", "Site carousel") },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setView(tab.id);
                setCreating(null);
              }}
              className={`rounded-full px-sp-4 py-1.5 text-sm font-semibold transition ${
                view === tab.id ? "bg-ink text-cream" : "text-ink/60 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(view === "deals" ? "deal" : "logo");
            setEditing(false);
          }}
          className="rounded-full bg-coral px-sp-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-moss"
        >
          {view === "deals" ? t("+ Nueva marca", "+ New brand") : t("+ Agregar logo", "+ Add logo")}
        </button>
      </div>

      {creating && (
        <Card className="mb-sp-5">
          <p className="mb-sp-4 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">
            {creating === "deal" ? t("Nueva marca", "New brand") : t("Nuevo logo para el carrusel", "New carousel logo")}
          </p>
          <BrandForm
            initial={creating === "logo" ? { ...emptyBrandForm, dealStatus: "", active: true } : undefined}
            submitLabel={t("Agregar marca", "Add brand")}
            onSubmit={handleCreate}
            onCancel={() => setCreating(null)}
          />
        </Card>
      )}

      {view === "carousel" ? (
        <div>
          <p className="mb-sp-4 text-sm text-ink/60">
            {t("El orden de esta lista es el orden del carrusel de logos en el sitio público.", "The order of this list is the order of the logo carousel on the public site.")}
          </p>
          <ul className="flex flex-col gap-sp-3">
            {brands.map((brand, index) => (
              <li key={brand.id} className={rowCardClass}>
                <ReorderButtons
                  onUp={() => handleMove(index, "up")}
                  onDown={() => handleMove(index, "down")}
                  disableUp={index === 0}
                  disableDown={index === brands.length - 1}
                />
                <BrandLogo brand={brand} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-ink">{brand.name}</p>
                  {!brand.active && <Badge className="mt-1">{t("Oculta del sitio", "Hidden from site")}</Badge>}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(brand.id);
                    setFilter("all");
                    setView("deals");
                    setEditing(true);
                  }}
                  className={accentLinkClass}
                >
                  {t("Editar", "Edit")}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(brand)}
                  className="text-sm font-medium text-ink/60 transition hover:text-ink"
                >
                  {brand.active ? t("Ocultar", "Hide") : t("Mostrar", "Show")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="mb-sp-4 flex flex-wrap gap-sp-2">
            {filterChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  filter === chip.id
                    ? "border-ink bg-ink text-cream"
                    : "border-line bg-white text-ink/70 hover:border-coral"
                }`}
              >
                {chip.label} <span className="opacity-60">{chip.count}</span>
              </button>
            ))}
          </div>

          <div className="grid items-start gap-sp-4 lg:grid-cols-[320px_1fr]">
            <ul className="flex flex-col gap-2.5">
              {visibleBrands.length === 0 && (
                <Card className="text-sm text-ink/60">
                  {filter === "deals"
                    ? t("Todavía no tienes tratos. Crea una marca nueva o abre “Todas” y asígnale un estado.", "You don't have deals yet. Create a new brand or open “All” and give it a status.")
                    : t("No hay marcas en este estado.", "No brands in this status.")}
                </Card>
              )}
              {visibleBrands.map((brand) => {
                const isSelected = brand.id === selectedId;
                const overdue = brand.nextActionDue && daysUntil(brand.nextActionDue) < 0;
                const meta = [
                  brand.dealValue != null ? formatMoney(brand.dealValue) : null,
                  brand.lastContactAt ? formatShortDate(brand.lastContactAt, lang) : null,
                  isPaymentStatus(brand.paymentStatus) ? pickLabel(lang, PAYMENT_STATUS_META[brand.paymentStatus]) : null,
                ].filter(Boolean);
                return (
                  <li key={brand.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(brand.id);
                        setEditing(false);
                        // En mobile el detalle queda debajo de la lista: lo traemos a la vista.
                        if (window.matchMedia("(max-width: 1023px)").matches) {
                          requestAnimationFrame(() =>
                            detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                          );
                        }
                      }}
                      className={`w-full rounded-[16px] border p-sp-4 text-left transition ${
                        isSelected
                          ? "border-ink bg-ink text-cream"
                          : "border-line bg-white text-ink hover:border-coral/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-sp-2">
                        <span className="truncate text-[15px] font-semibold">{brand.name}</span>
                        {isSelected ? (
                          <span className="rounded-full bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink">
                            {isDealStatus(brand.dealStatus) ? pickLabel(lang, DEAL_STATUS_META[brand.dealStatus]) : t("Portafolio", "Portfolio")}
                          </span>
                        ) : (
                          <StatusBadge status={brand.dealStatus} />
                        )}
                      </div>
                      {meta.length > 0 && (
                        <p className={`mt-1 text-[13px] ${isSelected ? "text-cream/70" : "text-ink/60"}`}>
                          {meta.join(" · ")}
                        </p>
                      )}
                      {brand.nextActionDue && (
                        <p
                          className={`mt-1 text-xs font-semibold ${
                            overdue ? (isSelected ? "text-lime" : "text-coral") : isSelected ? "text-cream/70" : "text-ink/50"
                          }`}
                        >
                          {dueLabel(brand.nextActionDue, lang)}
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div ref={detailRef} className="scroll-mt-sp-4">
              {selected ? (
                <Card className="p-sp-5 sm:p-sp-6">
                  {editing ? (
                    <>
                      <p className="mb-sp-4 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">
                        {t("Editar", "Edit")} {selected.name}
                      </p>
                      <BrandForm
                        key={selected.id}
                        initial={toFormValues(selected)}
                        submitLabel={t("Guardar cambios", "Save changes")}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditing(false)}
                      />
                    </>
                  ) : (
                    <BrandDetail
                      key={selected.id}
                      brand={selected}
                      onEdit={() => setEditing(true)}
                      onPatch={patchSelected}
                      onRequest={async (url, method, body) => {
                        const updated = await request(url, method, body);
                        if (!updated) return false;
                        replaceBrand(updated);
                        return true;
                      }}
                      onAddEvent={async (note, date) => {
                        const updated = await request(`${API_BASE}/${selected.id}/events`, "POST", { note, date });
                        if (!updated) return false;
                        replaceBrand(updated);
                        showToast("success", t("Agregado al historial", "Added to history"));
                        return true;
                      }}
                    />
                  )}
                </Card>
              ) : (
                <Card className="text-sm text-ink/60">{t("Elige una marca para ver su detalle.", "Choose a brand to see its details.")}</Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BrandDetail({
  brand,
  onEdit,
  onPatch,
  onAddEvent,
  onRequest,
}: {
  brand: BrandCrm;
  onEdit: () => void;
  onPatch: (body: Record<string, unknown>, successMessage: string) => Promise<boolean>;
  onAddEvent: (note: string, date: string) => Promise<boolean>;
  onRequest: (url: string, method: string, body?: unknown) => Promise<boolean>;
}) {
  const { t, lang } = useT();
  const [notes, setNotes] = useState(brand.notes ?? "");
  const [eventNote, setEventNote] = useState("");
  const [eventDate, setEventDate] = useState(() => dateToInput(new Date()));
  const [addingEvent, setAddingEvent] = useState(false);

  useEffect(() => setNotes(brand.notes ?? ""), [brand.notes]);

  const hasDeal = isDealStatus(brand.dealStatus);
  const overdueDays = brand.nextActionDue ? -daysUntil(brand.nextActionDue) : 0;
  const rightsEnd = usageRightsEnd(brand.usageRightsStart, brand.usageRightsDays);
  const rightsLeft = rightsEnd ? daysFromNow(rightsEnd) : null;
  const rightsSoon = rightsLeft != null && rightsLeft >= 0 && rightsLeft <= 7;
  const terms = [
    rightsEnd
      ? rightsLeft! < 0
        ? t(`Derechos de uso: vencieron el ${formatShortDate(rightsEnd, lang)}`, `Usage rights: expired on ${formatShortDate(rightsEnd, lang)}`)
        : t(
            `Derechos de uso: vencen el ${formatShortDate(rightsEnd, lang)} (en ${rightsLeft} ${rightsLeft === 1 ? "día" : "días"})`,
            `Usage rights: expire on ${formatShortDate(rightsEnd, lang)} (in ${rightsLeft} ${rightsLeft === 1 ? "day" : "days"})`
          )
      : null,
    brand.exclusivityDays
      ? t(
          `Exclusividad: ${brand.exclusivityDays} días${brand.exclusivityCategory ? ` en ${brand.exclusivityCategory}` : ""}`,
          `Exclusivity: ${brand.exclusivityDays} days${brand.exclusivityCategory ? ` in ${brand.exclusivityCategory}` : ""}`
        )
      : null,
    brand.whitelisting ? t("Incluye Spark Ads / whitelisting", "Includes Spark Ads / whitelisting") : null,
  ].filter((x): x is string => Boolean(x));

  const facts = [
    { label: t("Valor del trato", "Deal value"), value: formatMoney(brand.dealValue) },
    { label: t("Plataformas", "Platforms"), value: brand.platforms.length ? brand.platforms.join(", ") : "—" },
    { label: t("Último contacto", "Last contact"), value: formatShortDate(brand.lastContactAt, lang) },
    {
      label: t("Próximo paso", "Next step"),
      value: brand.nextAction || "—",
      sub: brand.nextActionDue ? `${formatShortDate(brand.nextActionDue, lang)} · ${dueLabel(brand.nextActionDue, lang)}` : null,
    },
    { label: t("Paquete", "Package"), value: brand.packageDetail || "—" },
  ];

  async function saveNotes() {
    if (notes === (brand.notes ?? "")) return;
    await onPatch({ notes }, t("Notas guardadas", "Notes saved"));
  }

  async function addEvent(event: React.FormEvent) {
    event.preventDefault();
    if (!eventNote.trim()) return;
    setAddingEvent(true);
    if (await onAddEvent(eventNote.trim(), eventDate)) setEventNote("");
    setAddingEvent(false);
  }

  return (
    <div className="flex flex-col gap-sp-5">
      <div className="flex flex-wrap items-start justify-between gap-sp-3">
        <div className="flex min-w-0 items-center gap-sp-3">
          <BrandLogo brand={brand} size="h-12 w-12" />
          <div className="min-w-0">
            <h2 className="truncate font-fraunces text-[26px] font-semibold leading-tight text-ink">{brand.name}</h2>
            {(brand.contactName || brand.contactEmail) && (
              <p className="truncate text-[13px] text-ink/60">
                {[brand.contactName, brand.contactEmail].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-sp-3">
          <StatusBadge status={brand.dealStatus} />
          <button type="button" onClick={onEdit} className={accentLinkClass}>
            {t("Editar datos", "Edit details")}
          </button>
        </div>
      </div>

      {hasDeal ? (
        <div className="grid grid-cols-2 gap-sp-4 sm:grid-cols-3 xl:grid-cols-5">
          {facts.map((fact) => (
            <div key={fact.label}>
              <p className={eyebrowClass}>{fact.label}</p>
              <p className="mt-sp-1 text-[15px] font-semibold leading-snug text-ink">{fact.value}</p>
              {fact.sub && <p className="mt-0.5 text-xs text-ink/55">{fact.sub}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-[12px] bg-cream px-sp-4 py-sp-3 text-sm text-ink/70">
          {t("Esta marca solo aparece en tu portafolio. Elige un estado abajo para empezar a darle seguimiento como trato.", "This brand only appears in your portfolio. Choose a status below to start tracking it as a deal.")}
        </p>
      )}

      {hasDeal && (
        <div>
          <p className={eyebrowClass}>{t("Pago", "Payment")}</p>
          <div className="mt-sp-2 flex flex-wrap gap-sp-2">
            {PAYMENT_STATUSES.map((status: PaymentStatus) => {
              const active = brand.paymentStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => !active && onPatch({ paymentStatus: status }, t("Pago actualizado", "Payment updated"))}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    active ? PAYMENT_STATUS_META[status].className + " ring-1 ring-current" : "bg-cream text-ink/60 hover:text-ink"
                  }`}
                >
                  {pickLabel(lang, PAYMENT_STATUS_META[status])}
                </button>
              );
            })}
          </div>
          {overdueDays > 0 && brand.nextAction && (
            <p className="mt-sp-3 text-[13px] font-semibold text-coral">
              {t(`Vencido hace ${overdueDays} ${overdueDays === 1 ? "día" : "días"}`, `Overdue by ${overdueDays} ${overdueDays === 1 ? "day" : "days"}`)} — {brand.nextAction}
            </p>
          )}
        </div>
      )}

      {hasDeal && terms.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-[12px] bg-cream px-sp-4 py-sp-3 text-[13px] text-ink">
          {terms.map((line, i) => (
            // La primera línea es la de derechos de uso: se resalta si vencen en 7 días o menos.
            <li key={line} className={i === 0 && rightsEnd && rightsSoon ? "font-semibold text-coral" : ""}>
              {line}
              {i === 0 && rightsEnd && rightsSoon && t(" · ¿Renovar?", " · Renew?")}
            </li>
          ))}
        </ul>
      )}

      {hasDeal && <DeliverablesSection brandId={brand.id} deliverables={brand.deliverables} onRequest={onRequest} />}

      <div>
        <p className={eyebrowClass}>{t("Publicaciones para esta marca", "Posts for this brand")}</p>
        {brand.contentCards.length === 0 ? (
          <p className="mt-sp-2 text-[13px] text-ink/55">
            {t("Ninguna todavía. Vincúlala desde el formulario de una tarjeta del", "None yet. Link it from a card form in the")}{" "}
            <Link href="/admin/feed" className={accentLinkClass}>
              Feed
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-sp-2 flex flex-col gap-sp-2">
            {brand.contentCards.map((card) => {
              const meta = PLATFORM_INITIALS[card.platform] ?? PLATFORM_INITIALS.ugc;
              return (
                <li key={card.id} className="flex items-center gap-2.5">
                  <span
                    className={`flex h-[22px] min-w-[22px] items-center justify-center rounded-[6px] px-1 font-mono text-[8px] font-bold ${meta.className}`}
                  >
                    {meta.initials}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{card.caption}</span>
                  <span className="shrink-0 text-xs text-ink/50">{formatShortDate(card.createdAt, lang)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <p className={eyebrowClass}>{t("Estado del trato", "Deal status")}</p>
        <div className="mt-sp-2 flex flex-wrap gap-sp-2">
          {DEAL_STATUSES.map((status) => {
            const active = brand.dealStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => !active && onPatch({ dealStatus: status }, `${t("Estado", "Status")}: ${pickLabel(lang, DEAL_STATUS_META[status])}`)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  active ? "bg-ink text-cream" : "bg-cream text-ink/70 hover:text-ink"
                }`}
              >
                {pickLabel(lang, DEAL_STATUS_META[status])}
              </button>
            );
          })}
          {hasDeal && (
            <button
              type="button"
              onClick={() => onPatch({ dealStatus: null }, t("Trato quitado", "Deal removed"))}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-ink/45 hover:text-ink"
            >
              {t("Quitar trato", "Remove deal")}
            </button>
          )}
        </div>
      </div>

      {hasDeal && (
        <>
          <label className="flex flex-col gap-sp-2">
            <span className={eyebrowClass}>{t("Notas", "Notes")}</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              rows={4}
              className={`${inputClass} resize-y`}
              placeholder={t("Condiciones, tiempos de pago, lo que pidió la marca…", "Terms, payment timing, what the brand asked for…")}
            />
            <span className="text-xs text-ink/45">{t("Se guardan solas al salir del campo.", "They save automatically when you leave the field.")}</span>
          </label>

          <div>
            <p className={eyebrowClass}>{t("Historial del acuerdo", "Deal history")}</p>
            <form onSubmit={addEvent} className="mt-sp-2 flex flex-col gap-sp-2 sm:flex-row">
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={`${inputClass} sm:w-40`}
                aria-label={t("Fecha", "Date")}
              />
              <input
                value={eventNote}
                onChange={(e) => setEventNote(e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder={t("Ej: Contraoferta de la marca: $800", "E.g.: Brand counteroffer: $800")}
                aria-label={t("Qué pasó", "What happened")}
              />
              <button type="submit" disabled={addingEvent || !eventNote.trim()} className={secondaryButtonClass}>
                {t("Agregar", "Add")}
              </button>
            </form>
            {brand.events.length === 0 ? (
              <p className="mt-sp-3 text-[13px] text-ink/55">{t("Sin movimientos todavía.", "No activity yet.")}</p>
            ) : (
              <ul className="mt-sp-3 flex flex-col gap-sp-2">
                {brand.events.map((event) => (
                  <li key={event.id} className="flex gap-sp-3 text-[13px]">
                    <span className="w-14 shrink-0 font-mono text-[11px] text-ink/50">{formatShortDate(event.date, lang)}</span>
                    <span className="text-ink">{event.note}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
