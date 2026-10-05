// Pedidos de datos de las cuentas (copia, recuperar, borrar). Sin dependencias de servidor:
// lo usan también los formularios del navegador.
import { pickLabel, type AdminLang } from "./admin-lang";

export const DATA_REQUEST_KINDS = [
  {
    id: "export",
    label: "Copia de mis datos",
    labelEn: "A copy of my data",
    hint: "Te mandamos todo lo que guardamos de tu cuenta.",
    hintEn: "We send you everything we store about your account.",
  },
  {
    id: "recover",
    label: "Recuperar algo que borré",
    labelEn: "Recover something I deleted",
    hint: "Cuéntanos qué se perdió y más o menos cuándo.",
    hintEn: "Tell us what was lost and roughly when.",
  },
  {
    id: "delete",
    label: "Borrar mi cuenta y mis datos",
    labelEn: "Delete my account and data",
    hint: "Se borra todo para siempre. No se puede deshacer.",
    hintEn: "Everything is deleted forever. This can't be undone.",
  },
] as const;

export type DataRequestKind = (typeof DATA_REQUEST_KINDS)[number]["id"];

export const isDataRequestKind = (value: unknown): value is DataRequestKind =>
  DATA_REQUEST_KINDS.some((k) => k.id === value);

export const dataRequestKindLabel = (id: string, lang: AdminLang = "es") => {
  const kind = DATA_REQUEST_KINDS.find((k) => k.id === id);
  return kind ? pickLabel(lang, kind) : id;
};

export const DATA_REQUEST_STATUS: Record<string, { label: string; labelEn: string; tone: string }> = {
  open: { label: "En proceso", labelEn: "In progress", tone: "bg-lime/40 text-ink" },
  done: { label: "Resuelto", labelEn: "Resolved", tone: "bg-sage/30 text-cobalt-ink" },
  rejected: { label: "No se pudo", labelEn: "Couldn't be done", tone: "bg-red-50 text-red-700" },
};
