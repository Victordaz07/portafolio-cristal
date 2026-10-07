import { z } from "zod";
import { PRODUCT_KINDS, validateProduct } from "@/lib/shop";

export const productSchema = z.object({
  kind: z.enum(PRODUCT_KINDS.map((k) => k.id) as [string, ...string[]]),
  title: z.string().trim().min(1).max(120),
  titleEn: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().max(600).default(""),
  descriptionEn: z.string().trim().max(600).nullable().optional(),
  priceCents: z.number().int().min(0).max(100_000_000).nullable().optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).default("USD"),
  imageUrl: z.string().url().max(600).startsWith("https://").nullable().optional().or(z.literal("")),
  buyUrl: z.string().trim().max(800),
  active: z.boolean().default(true),
});

export const checkProduct = (p: z.infer<typeof productSchema>) => validateProduct({ kind: p.kind, title: p.title, description: p.description, priceCents: p.priceCents, currency: p.currency, buyUrl: p.buyUrl });

/** Mensajes de error por motivo, en el idioma de la persona. */
export const PRODUCT_ERRORS = (t: (es: string, en: string) => string) => ({
  kind: t("Elige el tipo de producto", "Choose the product type"),
  title: t("Escribe un nombre (máximo 120 caracteres)", "Write a name (120 characters max)"),
  url: t("El enlace de pago debe empezar con https:// y ser una dirección válida", "The payment link must start with https:// and be a valid address"),
  price: t("Pon un precio mayor a 0 (solo los enlaces de afiliado pueden ir sin precio)", "Set a price above 0 (only affiliate links can go without one)"),
  description: t("La descripción puede tener hasta 600 caracteres", "The description can have up to 600 characters"),
  currency: t("La moneda debe ser un código de 3 letras, por ejemplo USD", "The currency must be a 3-letter code, for example USD"),
});

