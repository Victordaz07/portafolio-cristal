import { NextResponse } from "next/server";
import { sendBillingReminders } from "@/lib/billing-server";
import { getT } from "@/lib/admin-lang-server";
import { sendDealReminders } from "@/lib/deal-reminders";

export const dynamic = "force-dynamic";

/**
 * Tarea diaria (Vercel Cron, ver vercel.json): recordatorios de prueba y de plan por vencer o vencido,
 * y de los tratos (entregas en 2 días y derechos de uso que vencen en 7).
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
  return NextResponse.json({ ok: true, sent, deals });
}
