import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/admin-lang-server";
import { sessionCreatorSite } from "@/lib/site-url";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import ProductManager from "./ProductManager";

export const dynamic = "force-dynamic";

/** Tienda sin comisión (E6): tus productos digitales, asesorías y enlaces de afiliado. El cobro lo haces con tu propio enlace de pago. */
export default async function ShopAdminPage() {
  const { t } = await getT();
  const [products, site] = await Promise.all([prisma.product.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }), sessionCreatorSite()]);
  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Negocio", "Business")}
        title={t("Tienda", "Shop")}
        description={t(
          "Vende plantillas, presets, guías y asesorías, y recomienda productos de afiliado, sin comisión de Foliocrew. Tus clientes pagan directo en tu enlace de pago.",
          "Sell templates, presets, guides and consulting calls, and recommend affiliate products, with no Foliocrew commission. Your customers pay straight through your payment link."
        )}
      />
      <Card>
        <ul className="flex list-disc flex-col gap-1 pl-sp-5 text-sm text-ink/80">
          <li>{t("Foliocrew no cobra ni procesa pagos: pega aquí el enlace de pago de tu servicio (PayPal, Stripe, Gumroad, Lemon Squeezy, Calendly con pago…).", "Foliocrew doesn't charge or process payments: paste your payment service's link here (PayPal, Stripe, Gumroad, Lemon Squeezy, Calendly with payments…).")}</li>
          <li>{t("En los productos digitales, usa un enlace que entregue el archivo solo después del pago; Foliocrew no guarda tus archivos.", "For digital products, use a link that delivers the file only after payment; Foliocrew doesn't store your files.")}</li>
          <li>{t("Los enlaces de afiliado se muestran con un aviso («puedo ganar una comisión») para cumplir con las reglas de publicidad.", "Affiliate links are shown with a notice (“I may earn a commission”) to comply with advertising rules.")}</li>
        </ul>
        {site && (
          <p className="mt-sp-3 text-sm">
            {t("Tu tienda pública: ", "Your public shop: ")}
            <a href={`${site.url}/tienda`} target="_blank" rel="noreferrer noopener" className="font-semibold text-coral hover:underline">{`${site.url}/tienda`}</a>
          </p>
        )}
      </Card>
      <ProductManager
        products={products.map((p) => ({ id: p.id, kind: p.kind, title: p.title, titleEn: p.titleEn ?? "", description: p.description, descriptionEn: p.descriptionEn ?? "", priceCents: p.priceCents, currency: p.currency, imageUrl: p.imageUrl ?? "", buyUrl: p.buyUrl, active: p.active, clicks: p.clicks }))}
      />
    </div>
  );
}
