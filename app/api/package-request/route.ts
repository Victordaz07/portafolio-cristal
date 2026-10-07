import { NextResponse } from "next/server";
import { packageRequestSchema } from "@/lib/package-request";
import { createPackageRequest } from "@/lib/package-request-server";
import { clientIp, tooManyAttempts } from "@/lib/rate-limit";
import { getT } from "@/lib/admin-lang-server";

export const dynamic = "force-dynamic";

/** Una marca solicita un paquete desde el sitio público. Crea el trato en el CRM y avisa a la creadora. */
export async function POST(request: Request) {
  const { t } = await getT();
  if (tooManyAttempts(`package-request:${clientIp(request)}`, 3, 10 * 60_000)) {
    return NextResponse.json({ error: t("Demasiadas solicitudes; prueba en unos minutos", "Too many requests; try again in a few minutes") }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const parsed = packageRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: t("Revisa los campos del formulario", "Check the form fields") }, { status: 400 });
  }
  // Campo trampa lleno = bot: se responde «ok» sin guardar nada para que no sepa que lo descubrimos.
  if (parsed.data.website) return NextResponse.json({ ok: true });
  const result = await createPackageRequest(parsed.data);
  if (!result.ok) {
    return result.reason === "not_found"
      ? NextResponse.json({ error: t("Este paquete ya no está disponible", "This package is no longer available") }, { status: 404 })
      : NextResponse.json({ error: t("Hoy se recibieron demasiadas solicitudes; escribe por el formulario de contacto", "Too many requests were received today; please use the contact form") }, { status: 429 });
  }
  return NextResponse.json({ ok: true });
}
