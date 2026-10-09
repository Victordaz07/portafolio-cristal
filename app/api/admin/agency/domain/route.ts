import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaRoot } from "@/lib/prisma-root";
import { agencyUser } from "@/lib/agency";
import { forgetAgencyHost } from "@/lib/tenant";
import { dnsPointsToVercel, dnsRecordsFor, domainProblem, normalizeDomain, type DomainState } from "@/lib/domains";
import { addProjectDomain, projectDomainStatus, removeProjectDomain, vercelDomainsEnabled } from "@/lib/vercel-domains";
import { getT } from "@/lib/admin-lang-server";
import type { T } from "@/lib/admin-lang";

export const dynamic = "force-dynamic";

// Mismo flujo que /api/admin/domain (ver ese archivo), pero para el dominio propio de una
// agencia (plan Crew) en vez del de una creadora.

async function requireAgency() {
  const agency = await agencyUser();
  if (!agency) return null;
  return prismaRoot.agency.findUnique({ where: { id: agency.agencyId }, select: { id: true, customDomain: true, customDomainVerifiedAt: true } });
}

async function checkDomain(agencyId: string, domain: string, t: T): Promise<DomainState> {
  const automatic = vercelDomainsEnabled();
  let records = dnsRecordsFor(domain);
  let verified = false;
  let message: string | null = null;
  if (automatic) {
    try {
      const status = await projectDomainStatus(domain);
      records = [...dnsRecordsFor(domain, status.recommended), ...status.verification.map((v) => ({ type: "TXT" as const, name: v.domain, value: v.value }))];
      verified = status.verified && !status.misconfigured;
      if (!verified) {
        message = status.verification.length
          ? t("Ese dominio se usó antes en otra cuenta de Vercel: agrega también el registro TXT para confirmar que es tuyo.", "That domain was used before in another Vercel account: also add the TXT record to confirm it's yours.")
          : t("Todavía no vemos tu dominio apuntando a Foliocrew. Revisa los registros; los cambios de DNS pueden tardar hasta 48 h.", "We don't see your domain pointing to Foliocrew yet. Check the records; DNS changes can take up to 48 h.");
      }
    } catch (error) {
      message = t(`No se pudo consultar el dominio: ${error instanceof Error ? error.message : "error"}`, `Couldn't check the domain: ${error instanceof Error ? error.message : "error"}`);
    }
  } else {
    const dnsOk = await dnsPointsToVercel(domain, records);
    message = dnsOk
      ? t("Tu DNS ya apunta a Foliocrew. Falta que el equipo lo active en Vercel (modo manual).", "Your DNS already points to Foliocrew. The team still needs to activate it in Vercel (manual mode).")
      : t("Todavía no vemos tu dominio apuntando a Foliocrew. Los cambios de DNS pueden tardar hasta 48 h.", "We don't see your domain pointing to Foliocrew yet. DNS changes can take up to 48 h.");
  }
  await prismaRoot.agency.update({ where: { id: agencyId }, data: { customDomainVerifiedAt: verified ? new Date() : null } });
  if (verified) forgetAgencyHost(domain);
  return { domain, status: verified ? "verified" : "pending", records, automatic, message };
}

export async function GET() {
  const { t } = await getT();
  const agency = await requireAgency();
  if (!agency) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  if (!agency.customDomain) {
    return NextResponse.json({ domain: null, status: "none", records: [], automatic: vercelDomainsEnabled(), message: null } satisfies DomainState);
  }
  return NextResponse.json(await checkDomain(agency.id, agency.customDomain, t));
}

const domainSchema = z.object({ domain: z.string().min(1).max(253) });

export async function PUT(request: Request) {
  const { t } = await getT();
  const agency = await requireAgency();
  if (!agency) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  const parsed = domainSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: t("Escribe tu dominio", "Enter your domain") }, { status: 400 });
  const domain = normalizeDomain(parsed.data.domain);
  const problem = await domainProblem(domain, agency.id, "agency");
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  if (vercelDomainsEnabled()) {
    try {
      if (agency.customDomain && agency.customDomain !== domain) await removeProjectDomain(agency.customDomain);
      await addProjectDomain(domain);
    } catch (error) {
      return NextResponse.json({ error: t(`Vercel no aceptó el dominio: ${error instanceof Error ? error.message : "error"}`, `Vercel didn't accept the domain: ${error instanceof Error ? error.message : "error"}`) }, { status: 502 });
    }
  }
  await prismaRoot.agency.update({ where: { id: agency.id }, data: { customDomain: domain, customDomainVerifiedAt: null } });
  if (agency.customDomain) forgetAgencyHost(agency.customDomain);
  return NextResponse.json(await checkDomain(agency.id, domain, t));
}

export async function DELETE() {
  const { t } = await getT();
  const agency = await requireAgency();
  if (!agency) return NextResponse.json({ error: t("No autorizado", "Not authorized") }, { status: 401 });
  if (agency.customDomain) {
    if (vercelDomainsEnabled()) {
      try {
        await removeProjectDomain(agency.customDomain);
      } catch (error) {
        return NextResponse.json({ error: t(`Vercel no quitó el dominio: ${error instanceof Error ? error.message : "error"}`, `Vercel didn't remove the domain: ${error instanceof Error ? error.message : "error"}`) }, { status: 502 });
      }
    }
    forgetAgencyHost(agency.customDomain);
  }
  await prismaRoot.agency.update({ where: { id: agency.id }, data: { customDomain: null, customDomainVerifiedAt: null } });
  return NextResponse.json({ domain: null, status: "none", records: [], automatic: vercelDomainsEnabled(), message: null } satisfies DomainState);
}
