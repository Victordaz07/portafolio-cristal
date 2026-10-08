import Link from "next/link";
import { prismaRoot } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";
import { getT } from "@/lib/admin-lang-server";
import { platformOrigin } from "@/lib/site-url";
import { referralLink } from "@/lib/ambassadors";
import { ensureReferralCode, meritFor, referralStats } from "@/lib/ambassadors-server";
import { meritEnabled } from "@/lib/ambassadors";
import { earlyModules } from "@/lib/releases-server";
import { kitTexts, programRules } from "@/lib/ambassador-kit";
import AmbassadorPanel from "./AmbassadorPanel";
import MeritPanel from "./MeritPanel";

export const dynamic = "force-dynamic";

export default async function AmbassadorPage() {
  const { t, lang } = await getT();
  const session = await getSession();
  const creator = session
    ? await prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { ambassador: true, referralCode: true, ambassadorBadge: true, ambassadorPublic: true, ambassadorSince: true } })
    : null;

  // Mérito automático (G5): quien aún no es embajadora ve su enlace y cuánto le falta (si el dueño lo prendió).
  if (session && creator && !creator.ambassador && meritEnabled()) {
    const [code, progress, origin] = await Promise.all([ensureReferralCode(session.creatorId), meritFor(session.creatorId), platformOrigin()]);
    if (code) {
      return (
        <div className="flex flex-col gap-sp-5">
          <PageHeader
            eyebrow={t("Ayuda", "Help")}
            title={t("Invita y gana", "Invite and earn")}
            description={t("Si cinco personas que invites se quedan pagando su plan, subes sola al nivel Embajadora de Foliocrew.", "If five people you invite stay on a paid plan, you move up to the Foliocrew Ambassador tier on your own.")}
          />
          <MeritPanel link={referralLink(origin, code)} progress={progress} />
        </div>
      );
    }
  }

  if (!creator?.ambassador || !creator.referralCode) {
    return (
      <div className="flex flex-col gap-sp-5">
        <PageHeader eyebrow={t("Ayuda", "Help")} title={t("Embajadora de Foliocrew", "Foliocrew ambassador")} description={t("Un nivel por invitación para quien habla bien de Foliocrew y trae gente.", "An invite-only tier for people who speak well of Foliocrew and bring others in.")} />
        <Card>
          <p className="text-sm text-ink/80">
            {t(
              "Esta cuenta todavía no es embajadora. El nivel es solo por invitación: si crees que encajas, cuéntanos desde Soporte.",
              "This account isn't an ambassador yet. The tier is invite-only: if you think you're a fit, tell us from Support."
            )}
          </p>
          <Link href="/admin/soporte" className="mt-sp-3 inline-block text-sm font-semibold text-coral hover:underline">
            {t("Ir a Soporte", "Go to Support")}
          </Link>
        </Card>
      </div>
    );
  }

  const [stats, origin, early] = await Promise.all([referralStats(session!.creatorId), platformOrigin(), earlyModules()]);
  const link = referralLink(origin, creator.referralCode);

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Ayuda", "Help")}
        title={t("Embajadora de Foliocrew 💜", "Foliocrew ambassador 💜")}
        description={t(
          "Tu enlace, tus números y un kit para compartir. Tienes Folio Pro sin pagar mientras seas embajadora.",
          "Your link, your numbers and a kit to share. You have Folio Pro with nothing to pay while you're an ambassador."
        )}
      />
      <AmbassadorPanel
        link={link}
        code={creator.referralCode}
        badge={creator.ambassadorBadge}
        listed={creator.ambassadorPublic}
        early={early.map((m) => ({ id: m.id, label: lang === "en" ? m.nameEn : m.name, description: lang === "en" ? m.descriptionEn : m.description }))}
        stats={{ registered: stats.registered, paying: stats.paying, months: stats.monthsEarned }}
        kit={kitTexts(link, lang)}
        rules={programRules(lang)}
      />
    </div>
  );
}
