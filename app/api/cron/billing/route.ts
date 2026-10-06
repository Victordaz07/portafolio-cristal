import { NextResponse } from "next/server";
import { sendBillingReminders } from "@/lib/billing-server";
import { getT } from "@/lib/admin-lang-server";
import { sendDealReminders } from "@/lib/deal-reminders";
import { sendInvoiceReminders } from "@/lib/invoice-reminders";
import { grantAmbassadorRewards } from "@/lib/ambassadors-server";

export const dynamic = "force-dynamic";

/**
 * Tarea diaria (Vercel Cron, ver vercel.json): recordatorios de prueba y de plan por vencer o vencido,
 * de los tratos (entregas en 2 días y derechos de uso que vencen en 7) de facturas por cobrar y las recompensas del programa de embajadoras.
 */
export async function GET(request: Request) {
  const { t } = await getT();
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  }
  const sent = await sendBillingReminders();
  const deals = await sendDealReminders().catch((error) => {
    console.error("Falló el recordatorio de tratos", error);
    return null;
  });
  const invoices = await sendInvoiceReminders().catch((error) => {
    console.error("Falló el recordatorio de facturas", error);
    return null;
  });
  const ambassadors = await grantAmbassadorRewards().catch((error) => {
    console.error("Falló la recompensa de embajadoras", error);
    return null;
  });
  return NextResponse.json({ ok: true, sent, deals, invoices, ambassadors });
}
