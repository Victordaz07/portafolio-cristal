"use client";

import { useState } from "react";
import type { Service } from "@prisma/client";
import { useToast } from "@/components/admin/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ReorderButtons from "@/components/admin/ReorderButtons";
import { swapOrder } from "@/lib/reorder";
import { inputClass, primaryButtonClass } from "@/lib/admin-ui";
import { SERVICE_ICONS, SERVICE_ICON_OPTIONS, CameraIcon, type ServiceIconKey } from "@/components/icons";

const API_BASE = "/api/admin/services";

const EMPTY = { icon: "camera" as ServiceIconKey, title: "", description: "" };

export default function ServicesManager({ initialServices }: { initialServices: Service[] }) {
  const { showToast } = useToast();
  const [services, setServices] = useState(initialServices);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showToast("error", data.error ?? "No se pudo agregar el servicio");
      return;
    }

    const created: Service = await response.json();
    setServices((current) => [...current, created]);
    setForm(EMPTY);
    showToast("success", "Servicio agregado");
  }

  async function handleDelete(service: Service) {
    const response = await fetch(`${API_BASE}/${service.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) {
      showToast("error", "No se pudo eliminar");
      return;
    }
    setServices((current) => current.filter((item) => item.id !== service.id));
    showToast("success", "Servicio eliminado");
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const next = await swapOrder(services, index, direction, API_BASE);
    setServices(next);
  }

  return (
    <div>
      <ul className="flex flex-col gap-sp-3">
        {services.map((service, index) => {
          const Icon = SERVICE_ICONS[service.icon as ServiceIconKey] ?? CameraIcon;
          return (
            <li
              key={service.id}
              className="flex items-center gap-sp-4 rounded-md border border-line bg-white px-sp-4 py-sp-3"
            >
              <ReorderButtons
                onUp={() => handleMove(index, "up")}
                onDown={() => handleMove(index, "down")}
                disableUp={index === 0}
                disableDown={index === services.length - 1}
              />
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime/25 text-coral">
                <Icon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="font-medium text-ink">{service.title}</p>
                <p className="text-sm text-ink/60">{service.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setPendingDelete(service)}
                className="text-sm text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </li>
          );
        })}
      </ul>

      <form onSubmit={handleAdd} className="mt-sp-6 flex flex-col gap-sp-4 max-w-lg">
        <div className="grid gap-sp-4 sm:grid-cols-2">
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">Título</span>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-sp-1">
            <span className="text-sm font-medium text-ink">Ícono</span>
            <select
              value={form.icon}
              onChange={(e) => setForm((c) => ({ ...c, icon: e.target.value as ServiceIconKey }))}
              className={inputClass}
            >
              {SERVICE_ICON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-sp-1">
          <span className="text-sm font-medium text-ink">Descripción</span>
          <textarea
            required
            rows={2}
            value={form.description}
            onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
            className={inputClass}
          />
        </label>
        <button type="submit" disabled={saving} className={`${primaryButtonClass} self-start`}>
          {saving ? "Agregando..." : "+ agregar servicio"}
        </button>
      </form>

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar servicio"
          description={`¿Eliminar "${pendingDelete.title}"?`}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
