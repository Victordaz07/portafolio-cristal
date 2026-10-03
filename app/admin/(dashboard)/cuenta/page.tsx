import { prisma, prismaRoot } from "@/lib/prisma";
import Link from "next/link";
import { getSession } from "@/lib/tenant";
import { sessionCreatorSite } from "@/lib/site-url";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import AccountForm from "./AccountForm";
import { emailConfigured } from "@/lib/email";
import ShareInsightsButton from "@/components/admin/ShareInsightsButton";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ correo?: string }> }) {
  const { correo } = await searchParams;
  const session = await getSession();
  const [user, creator] = session
    ? await Promise.all([
        prisma.adminUser.findUnique({ where: { id: session.userId }, select: { name: true, email: true, emailVerifiedAt: true } }),
        prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { name: true, slug: true, customDomain: true, shareInsights: true, shareInsightsAt: true } }),
      ])
    : [null, null];
  const siteUrl = (await sessionCreatorSite())?.url ?? "";

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
      <AccountForm initialName={user?.name ?? creator?.name ?? ""} email={user?.email ?? ""} />
    </div>
  );
}
