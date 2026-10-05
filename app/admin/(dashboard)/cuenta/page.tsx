import { prisma, prismaRoot } from "@/lib/prisma";
import Link from "next/link";
import { getSession } from "@/lib/tenant";
import { sessionCreatorSite } from "@/lib/site-url";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import AccountForm from "./AccountForm";
import CreatorKindPicker from "./CreatorKindPicker";
import { creatorKind } from "@/lib/creator-kind";
import { emailConfigured } from "@/lib/email";
import { isPlatformAdminEmail } from "@/lib/platform-admin";
import ShareInsightsButton from "@/components/admin/ShareInsightsButton";
import DataRequestForm from "./DataRequestForm";
import { DATA_REQUEST_STATUS, dataRequestKindLabel } from "@/lib/data-export";

const fmtDate = (d: Date) => d.toLocaleString("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** "Motivo: Ticket #3: …" → "Ticket #3: …" (el registro guarda el motivo de cada acceso). */
const accessReason = (detail: string | null) => (detail?.startsWith("Motivo: ") ? detail.slice(8) : "Ayuda de soporte");

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ correo?: string }> }) {
  const { correo } = await searchParams;
  const session = await getSession();
  const [user, creator] = session
    ? await Promise.all([
        prisma.adminUser.findUnique({ where: { id: session.userId }, select: { name: true, email: true, emailVerifiedAt: true } }),
        prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { name: true, slug: true, customDomain: true, shareInsights: true, shareInsightsAt: true, creatorKind: true } }),
      ])
    : [null, null];
  const siteUrl = (await sessionCreatorSite())?.url ?? "";
  const [dataRequests, teamAccess] = session
    ? await Promise.all([
        prisma.dataRequest.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
        prismaRoot.platformAction.findMany({
          where: { creatorId: session.creatorId, action: { in: ["impersonate", "data-export"] } },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ])
    : [[], []];

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader eyebrow="Ayuda" title="Mi cuenta" description="Tus datos de acceso y la dirección de tu sitio." />
      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Tu sitio</p>
        <p className="font-mono text-sm text-ink">{siteUrl.replace("https://", "")}</p>
        <p className="mt-sp-1 text-xs text-ink/55">
          Para conectar tu propio dominio o ver tus otras direcciones, ve a{" "}
          <Link href="/admin/dominio" className="font-semibold text-coral hover:underline">
            Mi dominio
          </Link>
          .
        </p>
      </Card>
      {correo === "confirmado" && (
        <Card>
          <p role="status" className="text-sm text-ink">
            ✅ <strong>Correo confirmado.</strong> Te avisaremos aquí cuando una marca te escriba.
          </p>
        </Card>
      )}
      {correo === "vencido" && (
        <Card>
          <p role="alert" className="text-sm text-ink">
            Ese enlace venció o ya se usó.{user?.emailVerifiedAt ? " Tu correo ya está confirmado." : " Pide uno nuevo con el botón de arriba."}
          </p>
        </Card>
      )}
      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Correo de la cuenta</p>
        <p className="text-sm text-ink">
          <span className="font-mono">{user?.email}</span>{" "}
          {user?.emailVerifiedAt ? (
            <span className="ml-1 rounded-full bg-sage/30 px-[8px] py-0.5 font-mono text-[10px] uppercase text-cobalt-ink">Confirmado</span>
          ) : (
            <span className="ml-1 rounded-full bg-cream px-[8px] py-0.5 font-mono text-[10px] uppercase text-ink/60">Sin confirmar</span>
          )}
        </p>
        {!emailConfigured() && (
          <p className="mt-sp-1 text-xs text-ink/55">Los correos automáticos todavía no están activos en Foliocrew.</p>
        )}
      </Card>
      {creator && <CreatorKindPicker initial={creatorKind(creator.creatorKind)} />}
      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Inteligencia Foliocrew</p>
        <p className="text-sm text-ink">
          {creator?.shareInsights
            ? `Participas desde el ${creator.shareInsightsAt?.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) ?? "inicio"}. Tus métricas cuentan de forma anónima y agregada, y ves la comparativa de tu nicho en Reportes.`
            : "No participas. Si te sumas, ves qué funciona en tu nicho (horarios, formatos, ganchos) y tus métricas ayudan, de forma anónima, a las demás."}
        </p>
        <p className="mt-sp-1 text-xs text-ink/55">
          Nunca se muestra tu nombre, usuario ni marcas. Más detalles en la{" "}
          <Link href="/privacidad" className="font-semibold text-coral hover:underline">
            política de privacidad
          </Link>
          .
        </p>
        <div className="mt-sp-3">
          {creator?.shareInsights ? (
            <ShareInsightsButton share={false} label="Dejar de participar" variant="ghost" />
          ) : (
            <ShareInsightsButton share label="Sumarme" />
          )}
        </div>
      </Card>
      <Card>
        <div id="datos" className="scroll-mt-sp-6" />
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Tus datos</p>
        {session?.actorId ? (
          <p className="text-sm text-ink/70">Mientras el equipo ayuda en esta cuenta, la descarga y los pedidos de datos no están disponibles.</p>
        ) : (
          <DataRequestForm />
        )}
        {dataRequests.length > 0 && (
          <ul className="mt-sp-4 flex flex-col gap-sp-2 border-t border-line pt-sp-4 text-sm">
            {dataRequests.map((r) => {
              const status = DATA_REQUEST_STATUS[r.status] ?? DATA_REQUEST_STATUS.open;
              return (
                <li key={r.id} className="flex flex-col gap-sp-1">
                  <div className="flex flex-wrap items-center gap-sp-2">
                    <span className="font-semibold text-ink">{dataRequestKindLabel(r.kind)}</span>
                    <span className={`rounded-full px-[8px] py-px font-mono text-[10px] uppercase ${status.tone}`}>{status.label}</span>
                    <span className="font-mono text-xs text-ink/50">{fmtDate(r.createdAt)}</span>
                  </div>
                  {r.resolution && <p className="text-ink/70">💬 {r.resolution}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Card>
        <p className="mb-sp-2 font-mono text-[11px] uppercase tracking-[0.16em] text-coral">Accesos del equipo de Foliocrew</p>
        <p className="text-sm text-ink/70">
          Cada vez que alguien del equipo entra a tu cuenta para ayudarte (o saca una copia de tus datos) queda anotado aquí, con el motivo.
        </p>
        {teamAccess.length === 0 ? (
          <p className="mt-sp-2 text-sm text-ink/60">Nadie del equipo ha entrado a tu cuenta.</p>
        ) : (
          <ul className="mt-sp-3 flex flex-col gap-sp-2 text-sm">
            {teamAccess.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-x-sp-2 border-t border-line pt-sp-2 first:border-0 first:pt-0">
                <span className="font-mono text-xs text-ink/50">{fmtDate(a.createdAt)}</span>
                <span className="font-semibold text-ink">{a.actorEmail}</span>
                <span className="text-ink/70">
                  {a.action === "data-export" ? "Sacó una copia de tus datos" : `Entró a tu cuenta · ${accessReason(a.detail)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <AccountForm
        initialName={user?.name ?? creator?.name ?? ""}
        email={user?.email ?? ""}
        isPlatformAdmin={user ? isPlatformAdminEmail(user.email) : false}
        impersonating={Boolean(session?.actorId)}
      />
    </div>
  );
}
