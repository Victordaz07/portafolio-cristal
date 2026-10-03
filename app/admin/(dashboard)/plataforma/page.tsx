import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import { platformAdminUser } from "@/lib/platform-admin";
import { platformAccounts, startOfMonth } from "@/lib/platform-stats";
import { creatorSiteUrl } from "@/lib/site-url";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import AccountsTable from "./AccountsTable";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

export default async function PlatformPage() {
  const admin = await platformAdminUser();
  if (!admin) notFound();
  const [accounts, waitlist, aiTokens] = await Promise.all([
    platformAccounts(),
    prismaRoot.waitlistEntry.groupBy({ by: ["status"], _count: { _all: true } }),
    prismaRoot.aiUsage.aggregate({
      where: { createdAt: { gte: startOfMonth() } },
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true },
    }),
  ]);
  const now = Date.now();
  const total = accounts.length;
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : "—");
  const onboarded = accounts.filter((a) => a.onboardedAt).length;
  const verified = accounts.filter((a) => a.owner?.emailVerifiedAt).length;
  const waitlistTotal = waitlist.reduce((sum, row) => sum + row._count._all, 0);
  const waitlistJoined = waitlist.find((row) => row.status === "joined")?._count._all ?? 0;
  const tokens = (aiTokens._sum.inputTokens ?? 0) + (aiTokens._sum.outputTokens ?? 0);

  const kpis: [string, string | number, string?][] = [
    ["Cuentas", total],
    ["Nuevas (7 días)", accounts.filter((a) => now - a.createdAt.getTime() < 7 * DAY).length],
    ["Entraron (7 días)", accounts.filter((a) => a.owner?.lastLoginAt && now - a.owner.lastLoginAt.getTime() < 7 * DAY).length],
    ["Terminaron el asistente", onboarded, pct(onboarded)],
    ["Correo confirmado", verified, pct(verified)],
    ["Pausadas", accounts.filter((a) => a.status !== "active").length],
    ["Lista de espera → cuenta", `${waitlistJoined}/${waitlistTotal}`],
    ["Sugerencias de IA (mes)", aiTokens._count._all, tokens ? `${Math.round(tokens / 1000)}k tokens` : undefined],
  ];

  const rows = await Promise.all(
    accounts.map(async (a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      siteUrl: await creatorSiteUrl(a),
      email: a.owner?.email ?? "—",
      verified: Boolean(a.owner?.emailVerifiedAt),
      createdAt: a.createdAt.toISOString(),
      lastLoginAt: a.owner?.lastLoginAt?.toISOString() ?? null,
      onboarded: Boolean(a.onboardedAt),
      content: a._count.contentCards,
      brands: a._count.brands,
      messages: a._count.contactMessages,
      networks: a.networks,
      aiThisMonth: a.aiThisMonth,
      status: a.status,
      hasNote: Boolean(a.adminNote),
      isMine: a.id === admin.creatorId,
    }))
  );

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow="Foliocrew"
        title="Cuentas"
        description="Todas las cuentas de Foliocrew: cómo van, cuánto usan la IA y acciones de soporte. Solo quien administra la plataforma ve esta sección."
      />
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {kpis.map(([label, value, sub]) => (
          <Card key={label}>
            <p className="font-fraunces text-3xl font-semibold text-coral">{value}</p>
            <p className="mt-sp-1 text-sm text-ink/70">{label}</p>
            {sub && <p className="text-xs text-ink/45">{sub}</p>}
          </Card>
        ))}
      </div>
      <Card>
        <p className="text-xs text-ink/55">
          Planes y pagos llegan con la Fase 10 (Stripe). Mientras tanto, todas las cuentas usan Foliocrew sin cobro.
        </p>
      </Card>
      <AccountsTable rows={rows} />
    </div>
  );
}
