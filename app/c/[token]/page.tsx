import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { notifyCreatorAboutContract } from "@/lib/contracts-server";
import { tooManyAttempts } from "@/lib/rate-limit";
import ContractDocument from "@/components/contract/ContractDocument";
import ContractPublicActions, { PrintBar } from "./ContractPublicActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acuerdo · Agreement",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Página pública de un contrato: la abre la marca con el enlace del correo (sin iniciar sesión). */
export default async function PublicContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) notFound();
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (tooManyAttempts(`contract-page:${ip}`, 60, 60_000)) notFound();

  const contract = await prismaRoot.contract.findUnique({ where: { publicToken: token } });
  if (!contract) notFound();
  const session = await getSession();
  const isOwner = session?.creatorId === contract.creatorId;
  // Un borrador solo lo ve su creador (vista previa).
  if (contract.status === "draft" && !isOwner) notFound();

  // La primera vez que lo abre alguien que no es el creador: queda "visto" y se le avisa.
  if (!isOwner && contract.status === "sent" && !contract.viewedAt) {
    const marked = await prismaRoot.contract.updateMany({ where: { id: contract.id, viewedAt: null }, data: { viewedAt: new Date() } });
    if (marked.count) await notifyCreatorAboutContract("viewed", contract);
  }

  const lang = contract.language === "en" ? "en" : "es";
  const parties = contract.parties as { brand?: { email?: string } } | null;
  const acceptance =
    contract.status === "accepted" && contract.acceptedAt
      ? { name: contract.acceptedName ?? "", email: contract.acceptedEmail ?? "", at: contract.acceptedAt, ip: contract.acceptedIp, hash: contract.bodyHash }
      : null;

  return (
    <main className="min-h-screen bg-cream px-sp-4 py-sp-6 sm:py-sp-10 print:bg-white print:p-0">
      {isOwner && contract.status === "draft" && (
        <p className="mx-auto mb-sp-4 max-w-3xl rounded-[12px] bg-coral/10 px-sp-4 py-sp-2 text-sm text-ink print:hidden">
          {lang === "en" ? "Preview: this agreement is still a draft. The brand can't see it until you send it." : "Vista previa: este acuerdo todavía es un borrador. La marca no lo ve hasta que lo envíes."}
        </p>
      )}
      {contract.status === "declined" && (
        <p className="mx-auto mb-sp-4 max-w-3xl rounded-[12px] bg-coral/10 px-sp-4 py-sp-2 text-sm text-ink print:hidden">
          {lang === "en" ? "Changes were requested on this agreement. It can't be accepted until it's updated and sent again." : "Se pidieron cambios en este acuerdo. No se puede aceptar hasta que se actualice y se envíe de nuevo."}
        </p>
      )}
      <PrintBar lang={lang} />
      <ContractDocument bodyText={contract.bodyText} language={contract.language} status={contract.status} acceptance={acceptance} />
      <ContractPublicActions token={token} lang={lang} canRespond={!isOwner && contract.status === "sent"} defaultEmail={parties?.brand?.email ?? ""} />
      <p className="mx-auto mt-sp-4 max-w-3xl text-center text-[11px] text-ink/40 print:hidden">{lang === "en" ? "Agreement created with Foliocrew" : "Acuerdo creado con Foliocrew"}</p>
    </main>
  );
}
