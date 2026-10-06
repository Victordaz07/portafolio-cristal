import Link from "next/link";
import { prismaRoot } from "@/lib/prisma-root";
import { getSession } from "@/lib/tenant";
import { getT } from "@/lib/admin-lang-server";
import { ensureProfile } from "@/lib/community-server";
import { levelLabel } from "@/lib/community";
import PageHeader from "@/components/admin/PageHeader";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function CommunityProfilePage() {
  const { t, lang } = await getT();
  const session = await getSession();
  if (!session) return null;
  const [profile, creator, user] = await Promise.all([
    ensureProfile(session.creatorId),
    prismaRoot.creator.findUnique({ where: { id: session.creatorId }, select: { slug: true } }),
    prismaRoot.adminUser.findUnique({ where: { id: session.userId }, select: { emailVerifiedAt: true } }),
  ]);
  const firstTime = !profile.acceptedRulesAt;

  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Comunidad", "Community")}
        title={firstTime ? t("Te damos la bienvenida a la comunidad", "Welcome to the community") : t("Mi perfil de comunidad", "My community profile")}
        description={
          firstTime
            ? t(
                "Un espacio para creadores de todo tipo: preguntas, consejos, logros y colaboraciones. Ya armamos tu perfil con tus datos de Foliocrew; revísalo y entra.",
                "A space for every kind of creator: questions, tips, wins and collaborations. We built your profile from your Foliocrew details; review it and come in."
              )
            : t(
                `Así te ven en la comunidad como @${creator?.slug}. Nivel: ${levelLabel(profile.reputation, lang)} · ${profile.reputation} puntos.`,
                `This is how the community sees you as @${creator?.slug}. Level: ${levelLabel(profile.reputation, lang)} · ${profile.reputation} points.`
              )
        }
        action={
          !firstTime && creator ? (
            <Link href={`/admin/comunidad/creador/${creator.slug}`} className="text-sm font-semibold text-coral hover:underline">
              {t("Ver cómo me ven →", "See how others see me →")}
            </Link>
          ) : undefined
        }
      />
      {!user?.emailVerifiedAt && (
        <p className="rounded-[14px] bg-coral/10 px-sp-4 py-sp-3 text-sm text-ink">
          {t(
            "Puedes leer la comunidad, pero para publicar y responder primero confirma tu correo (revisa tu bandeja de entrada).",
            "You can read the community, but to post and reply, first confirm your email (check your inbox)."
          )}
        </p>
      )}
      <ProfileForm
        firstTime={firstTime}
        initial={{
          displayName: profile.displayName,
          headline: profile.headline,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl ?? "",
          city: profile.city ?? "",
          showCity: profile.showCity,
          showSite: profile.showSite,
          creatorTypes: profile.creatorTypes,
          niche: profile.niche ?? "",
          languages: profile.languages.filter((l): l is "es" | "en" => l === "es" || l === "en"),
          openToCollab: profile.openToCollab,
          emailNotify: profile.emailNotify,
        }}
      />
    </div>
  );
}
