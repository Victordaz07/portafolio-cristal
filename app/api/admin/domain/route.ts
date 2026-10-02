import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { forgetHost, getSession } from "@/lib/tenant";
import { dnsPointsToVercel, dnsRecordsFor, domainProblem, normalizeDomain, type DomainState } from "@/lib/domains";
import { addProjectDomain, projectDomainStatus, removeProjectDomain, vercelDomainsEnabled } from "@/lib/vercel-domains";

export const dynamic = "force-dynamic";

async function requireCreator() {
  const session = await getSession();
  if (!session) return null;
  return prismaRoot.creator.findUnique({
    where: { id: session.creatorId },
    select: { id: true, customDomain: true, customDomainVerifiedAt: true },
  });
}

/** Comprueba el estado real del dominio y guarda si ya quedó verificado. */
async function checkDomain(creatorId: string, domain: string): Promise<DomainState> {
  const automatic = vercelDomainsEnabled();
  let records = dnsRecordsFor(domain);
  let verified = false;
  let message: string | null = null;
  if (automatic) {
    try {
      const status = await projectDomainStatus(domain);
      records = [
        ...dnsRecordsFor(domain, status.recommended),
        ...status.verification.map((v) => ({ type: "TXT" as const, name: v.domain, value: v.value })),
      ];
      verified = status.verified && !status.misconfigured;
      if (!verified) {
        message = status.verification.length
          ? "Ese dominio se usó antes en otra cuenta de Vercel: agrega también el registro TXT para confirmar que es tuyo."
          : "Todavía no vemos tu dominio apuntando a Foliocrew. Revisa los registros; los cambios de DNS pueden tardar hasta 48 h.";
      }
    } catch (error) {
      message = `No se pudo consultar el dominio: ${error instanceof Error ? error.message : "error"}`;
    }
  } else {
    const dnsOk = await dnsPointsToVercel(domain, records);
    message = dnsOk
      ? "Tu DNS ya apunta a Foliocrew. Falta que el equipo lo active en Vercel (modo manual)."
      : "Todavía no vemos tu dominio apuntando a Foliocrew. Los cambios de DNS pueden tardar hasta 48 h.";
  }
  await prismaRoot.creator.update({
    where: { id: creatorId },
    data: { customDomainVerifiedAt: verified ? new Date() : null },
  });
  if (verified) forgetHost(domain);
  return { domain, status: verified ? "verified" : "pending", records, automatic, message };
}

export async function GET() {
  const creator = await requireCreator();
  if (!creator) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!creator.customDomain) {
    return NextResponse.json({ domain: null, status: "none", records: [], automatic: vercelDomainsEnabled(), message: null } satisfies DomainState);
  }
  return NextResponse.json(await checkDomain(creator.id, creator.customDomain));
}

const domainSchema = z.object({ domain: z.string().min(1).max(253) });

export async function PUT(request: Request) {
  const creator = await requireCreator();
  if (!creator) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = domainSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Escribe tu dominio" }, { status: 400 });
  const domain = normalizeDomain(parsed.data.domain);
  const problem = await domainProblem(domain, creator.id);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  if (vercelDomainsEnabled()) {
    try {
      if (creator.customDomain && creator.customDomain !== domain) await removeProjectDomain(creator.customDomain);
      await addProjectDomain(domain);
    } catch (error) {
      return NextResponse.json({ error: `Vercel no aceptó el dominio: ${error instanceof Error ? error.message : "error"}` }, { status: 502 });
    }
  }
  await prismaRoot.creator.update({ where: { id: creator.id }, data: { customDomain: domain, customDomainVerifiedAt: null } });
  if (creator.customDomain) forgetHost(creator.customDomain);
  return NextResponse.json(await checkDomain(creator.id, domain));
}

export async function DELETE() {
  const creator = await requireCreator();
  if (!creator) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (creator.customDomain) {
    if (vercelDomainsEnabled()) {
      try {
        await removeProjectDomain(creator.customDomain);
      } catch (error) {
        return NextResponse.json({ error: `Vercel no quitó el dominio: ${error instanceof Error ? error.message : "error"}` }, { status: 502 });
      }
    }
    forgetHost(creator.customDomain);
  }
  await prismaRoot.creator.update({ where: { id: creator.id }, data: { customDomain: null, customDomainVerifiedAt: null } });
  return NextResponse.json({ domain: null, status: "none", records: [], automatic: vercelDomainsEnabled(), message: null } satisfies DomainState);
}
