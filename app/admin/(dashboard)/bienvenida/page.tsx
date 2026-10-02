import { prisma, prismaRoot } from "@/lib/prisma";
import { getSession } from "@/lib/tenant";
import { NICHES } from "@/lib/onboarding";
import Wizard from "./Wizard";

export default async function WelcomePage() {
  const session = await getSession();
  const [hero, settings, user] = await Promise.all([
    prisma.hero.findFirst({ select: { name: true, photoUrl: true, location: true } }),
    prisma.siteSettings.findFirst({ select: { contactEmail: true, instagramHandle: true, tiktokHandle: true, whatsapp: true, accentColor: true } }),
    session ? prismaRoot.adminUser.findUnique({ where: { id: session.userId }, select: { email: true } }) : null,
  ]);

  return (
    <Wizard
      niches={NICHES}
      initial={{
        displayName: hero?.name ?? "",
        photoUrl: hero?.photoUrl ?? "",
        location: hero?.location ?? "",
        contactEmail: settings?.contactEmail || user?.email || "",
        instagram: settings?.instagramHandle ?? "",
        tiktok: settings?.tiktokHandle ?? "",
        whatsapp: settings?.whatsapp ?? "",
        accentColor: settings?.accentColor ?? "lila",
      }}
    />
  );
}
