// Tienda sin comisión (E6). Lógica pura (se prueba en tests/shop.test.ts).
// Foliocrew no cobra ni procesa pagos: cada producto lleva el enlace de pago de la creadora.

export const PRODUCT_KINDS = [
  { id: "digital", label: "Producto digital", labelEn: "Digital product", hint: "Plantillas, presets, guías… usa un enlace de pago que entregue el archivo solo.", hintEn: "Templates, presets, guides… use a payment link that delivers the file on its own.", button: "Comprar", buttonEn: "Buy" },
  { id: "call", label: "Asesoría por llamada", labelEn: "Consulting call", hint: "Un enlace para reservar y pagar (Calendly con pago, Stripe, PayPal…).", hintEn: "A link to book and pay (Calendly with payments, Stripe, PayPal…).", button: "Reservar", buttonEn: "Book" },
  { id: "affiliate", label: "Enlace de afiliado", labelEn: "Affiliate link", hint: "Algo que recomiendas y por lo que ganas una comisión. Se muestra con un aviso de afiliado.", hintEn: "Something you recommend and earn a commission on. It's shown with an affiliate notice.", button: "Ver oferta", buttonEn: "See offer" },
] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number]["id"];
export const isProductKind = (v: string): v is ProductKind => PRODUCT_KINDS.some((k) => k.id === v);

export const MAX_PRODUCTS = 50;
export const MAX_PRICE_CENTS = 1_000_000_00;

/** Texto del botón según el tipo y el idioma. */
export function buttonLabel(kind: string, locale: "es" | "en") {
  const k = PRODUCT_KINDS.find((p) => p.id === kind);
  return k ? (locale === "en" ? k.buttonEn : k.button) : locale === "en" ? "Open" : "Abrir";
}

/** El enlace de compra debe ser https, sin usuario ni contraseña (nada de javascript:, data: ni http). */
export function isSafeBuyUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && url.hostname.includes(".");
  } catch {
    return false;
  }
}

/** Precio mostrado: «$29», «$29.50» o «USD 29» según la moneda. null si no hay precio. */
export function formatPrice(cents: number | null | undefined, currency: string, locale: "es" | "en") {
  if (cents == null || cents <= 0) return null;
  try {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-US", { style: "currency", currency, minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
  }
}

export interface ProductInput {
  kind: string;
  title: string;
  description?: string;
  priceCents?: number | null;
  currency?: string;
  buyUrl: string;
}

export type ProductCheck = { ok: true } | { ok: false; reason: "kind" | "title" | "url" | "price" | "description" | "currency" };

export function validateProduct(p: ProductInput): ProductCheck {
  if (!isProductKind(p.kind)) return { ok: false, reason: "kind" };
  if (!p.title.trim() || p.title.trim().length > 120) return { ok: false, reason: "title" };
  if ((p.description ?? "").length > 600) return { ok: false, reason: "description" };
  if (!isSafeBuyUrl(p.buyUrl)) return { ok: false, reason: "url" };
  if (p.currency && !/^[A-Z]{3}$/.test(p.currency)) return { ok: false, reason: "currency" };
  if (p.priceCents != null && (!Number.isInteger(p.priceCents) || p.priceCents < 0 || p.priceCents > MAX_PRICE_CENTS)) return { ok: false, reason: "price" };
  // Un producto digital o una asesoría sin precio visible confunde a quien compra: el precio es obligatorio.
  if (p.kind !== "affiliate" && !(p.priceCents && p.priceCents > 0)) return { ok: false, reason: "price" };
  return { ok: true };
}

/** El aviso de afiliados es obligatorio mientras se muestre al menos un enlace de afiliado (FTC). */
export const needsAffiliateNotice = (products: { kind: string; active: boolean }[]) => products.some((p) => p.active && p.kind === "affiliate");

/** `rel` del enlace de compra: los de afiliado llevan «sponsored». */
export const relFor = (kind: string) => (kind === "affiliate" ? "sponsored noopener noreferrer" : "noopener noreferrer");
