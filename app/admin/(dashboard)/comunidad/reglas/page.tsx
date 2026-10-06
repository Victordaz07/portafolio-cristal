import Link from "next/link";
import { getT } from "@/lib/admin-lang-server";
import { LIMITS, REPUTATION, LEVELS } from "@/lib/community";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/admin/Card";

export const dynamic = "force-dynamic";

/** Reglas de la comunidad, en simple. */
export default async function CommunityRulesPage() {
  const { t, lang } = await getT();
  const en = lang === "en";

  const rules: [string, string][] = en
    ? [
        ["🤝 Respect, always", "There are creators of every size, niche and country here. Disagree with ideas, never attack people. No harassment, discrimination or mockery."],
        ["🚫 No spam or unsolicited selling", "Don't promote services, courses or “collab” offers that are really ads. Sharing a useful resource is fine; selling to everyone who asks for help isn't."],
        ["🔒 Protect other people's data", "Don't post emails, phone numbers, addresses or private conversations of other people (or brands) without permission."],
        ["⚠️ Zero scams", "No buying/selling followers, fake giveaways or “pay to get paid” schemes. If something smells off, report it."],
        ["💜 Support every level", "Someone with 300 followers deserves the same respect as someone with 300K. We all started somewhere."],
        ["✍️ Share real experience", "Give context and examples. Don't present guesses as facts, especially on money, legal or tax topics."],
      ]
    : [
        ["🤝 Respeto siempre", "Aquí hay creadores de todos los tamaños, nichos y países. Debate ideas, nunca ataques a las personas. Nada de acoso, discriminación ni burlas."],
        ["🚫 Nada de spam ni ventas no pedidas", "No promociones servicios, cursos ni “colaboraciones” que en realidad son anuncios. Compartir un recurso útil está bien; venderle a todo el que pide ayuda, no."],
        ["🔒 Cuida los datos de otras personas", "No publiques correos, teléfonos, direcciones ni conversaciones privadas de otras personas (ni de marcas) sin permiso."],
        ["⚠️ Cero estafas", "Nada de comprar o vender seguidores, sorteos falsos ni esquemas de “paga para cobrar”. Si algo huele raro, repórtalo."],
        ["💜 Apoyo a todos los niveles", "Quien tiene 300 seguidores merece el mismo respeto que quien tiene 300K. Todos empezamos en algún lado."],
        ["✍️ Comparte experiencia real", "Da contexto y ejemplos. No presentes suposiciones como hechos, sobre todo en temas de dinero, legales o de impuestos."],
      ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-sp-5">
      <PageHeader
        eyebrow={t("Comunidad", "Community")}
        title={t("Reglas de la comunidad", "Community rules")}
        description={t(
          "Para que este sea un lugar útil y seguro para todos los creadores. Al participar aceptas estas reglas.",
          "So this stays a useful, safe place for every creator. By taking part you accept these rules."
        )}
      />
      <Card className="flex flex-col gap-sp-4">
        {rules.map(([title, text]) => (
          <div key={title}>
            <p className="font-semibold text-ink">{title}</p>
            <p className="mt-1 text-sm text-ink/70">{text}</p>
          </div>
        ))}
      </Card>
      <Card className="flex flex-col gap-sp-3 text-sm text-ink/75">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral">{t("Cómo funciona", "How it works")}</p>
        <p>
          {t(
            `💡 Cada “me sirvió” que recibes suma ${REPUTATION.helpful} puntos y cada “mejor respuesta”, ${REPUTATION.bestAnswer}. Niveles: ${LEVELS.map((l) => `${l.label} (${l.min})`).join(", ")}.`,
            `💡 Each “helpful” you get adds ${REPUTATION.helpful} points and each “best answer”, ${REPUTATION.bestAnswer}. Levels: ${LEVELS.map((l) => `${l.labelEn} (${l.min})`).join(", ")}.`
          )}
        </p>
        <p>
          {t(
            `🚩 Si algo rompe las reglas, toca “Reportar”. Es anónimo. Con ${LIMITS.reportsToAutoHide} reportes el contenido se oculta solo hasta que el equipo lo revise.`,
            `🚩 If something breaks the rules, tap “Report”. It's anonymous. With ${LIMITS.reportsToAutoHide} reports the content hides itself until the team reviews it.`
          )}
        </p>
        <p>
          {t(
            "🛡️ El equipo de Comunidad de Foliocrew puede ocultar contenido o pausar la participación de una cuenta (1, 7 o 30 días). Siempre te avisamos por correo.",
            "🛡️ The Foliocrew Community team can hide content or pause an account's participation (1, 7 or 30 days). We always let you know by email."
          )}
        </p>
        <p>
          {t(
            "🙈 Puedes bloquear a cualquier persona desde su perfil: dejan de verse y no te puede responder.",
            "🙈 You can block anyone from their profile: you stop seeing each other and they can't reply to you."
          )}
        </p>
        <p>
          {t(
            "🔐 La comunidad solo la ven cuentas de Foliocrew y tu correo nunca se muestra.",
            "🔐 Only Foliocrew accounts can see the community, and your email is never shown."
          )}
        </p>
      </Card>
      <Link href="/admin/comunidad" className="self-start text-sm font-semibold text-coral hover:underline">
        {t("← Volver al muro", "← Back to the wall")}
      </Link>
    </div>
  );
}
