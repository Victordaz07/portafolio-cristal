import type { Metadata } from "next";
import LegalPageView from "@/components/LegalPageView";
import { siteConfig } from "@/lib/site-config";
import { prismaRoot } from "@/lib/prisma-root";

export const metadata: Metadata = { title: `Eliminación de datos — ${siteConfig.platformName}` };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string; codigo?: string }> }) {
  const { lang, codigo } = await searchParams;
  // Estado de una solicitud que llegó desde Meta (la dirección se la damos a Meta con el código).
  const request = codigo && /^[a-f0-9]{6,32}$/.test(codigo)
    ? await prismaRoot.dataDeletionRequest.findUnique({ where: { code: codigo } })
    : null;
  const en = lang === "en";
  const notice = codigo ? (
    <div role="status" className="mt-sp-5 rounded-[18px] border border-line bg-white p-sp-5 text-sm text-ink">
      {request ? (
        <>
          <p className="font-semibold">
            {en ? "Deletion request" : "Solicitud de eliminación"} <span className="font-mono">{request.code}</span>:{" "}
            {en ? "completed" : "completada"} ✅
          </p>
          <p className="mt-sp-1 text-ink/70">
            {en
              ? `On ${request.createdAt.toUTCString()} we deleted the access tokens and data of the connected account(s) (${request.deletedAccounts}).`
              : `El ${request.createdAt.toLocaleString("es")} borramos los tokens de acceso y los datos de la(s) cuenta(s) conectada(s) (${request.deletedAccounts}).`}
          </p>
        </>
      ) : (
        <p>{en ? "We could not find that confirmation code." : "No encontramos ese código de confirmación."}</p>
      )}
    </div>
  ) : null;
  return <LegalPageView id="deletion" lang={lang} notice={notice} />;
}
