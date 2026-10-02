import { notFound } from "next/navigation";
import { prismaRoot } from "@/lib/prisma-root";
import { isPlatformAdmin } from "@/lib/platform-admin";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import WaitlistTable from "./WaitlistTable";
import { emailConfigured } from "@/lib/email";

export default async function WaitlistPage() {
  if (!(await isPlatformAdmin())) notFound();
  const entries = await prismaRoot.waitlistEntry.findMany({ orderBy: { createdAt: "asc" } });
  const bySource = new Map<string, number>();
  for (const e of entries) bySource.set(e.utmSource || "directo", (bySource.get(e.utmSource || "directo") ?? 0) + 1);
  const last7 = entries.filter((e) => Date.now() - e.createdAt.getTime() < 7 * 86_400_000).length;
  const invited = entries.filter((e) => e.status === "invited").length;
  const joined = entries.filter((e) => e.status === "joined").length;
  const root = process.env.PLATFORM_ROOT_DOMAIN;
  const origin = root ? `https://${root}` : "";

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow="Foliocrew"
        title="Lista de espera"
        description="Las personas que se anotaron en la página de venta. Solo quien administra la plataforma ve esta sección."
      />
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-5">
        {[
          ["Total", entries.length],
          ["Últimos 7 días", last7],
          ["En espera", entries.length - invited - joined],
          ["Con invitación", invited],
          ["Ya crearon cuenta", joined],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="font-fraunces text-3xl font-semibold text-coral">{value}</p>
            <p className="mt-sp-1 text-sm text-ink/70">{label}</p>
          </Card>
        ))}
      </div>
      {bySource.size > 0 && (
        <Card>
          <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">De dónde llegaron (utm_source)</p>
          <div className="flex flex-wrap gap-sp-2">
            {Array.from(bySource.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([source, count]) => (
                <span key={source} className="rounded-full bg-cream px-sp-3 py-1 text-sm">
                  {source} <strong className="font-mono">{count}</strong>
                </span>
              ))}
          </div>
        </Card>
      )}
      <WaitlistTable
        entries={entries.map((e) => ({
          id: e.id,
          email: e.email,
          instagram: e.instagram,
          niche: e.niche,
          audience: e.audience,
          source: [e.utmSource, e.utmCampaign].filter(Boolean).join(" · "),
          status: e.status,
          createdAt: e.createdAt.toISOString(),
        }))}
        inviteCodeSet={Boolean(process.env.SIGNUP_INVITE_CODE)}
        emailReady={emailConfigured()}
        registerUrl={`${origin}/admin/registro`}
        landingUrl={root ? origin : "/foliocrew"}
      />
    </div>
  );
}
