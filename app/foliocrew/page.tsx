import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { PLANS, showPrices } from "@/lib/plans";
import WaitlistForm, { type Utm } from "./WaitlistForm";
import MetaPixel from "./MetaPixel";
import { getT } from "@/lib/admin-lang-server";
import type { AdminLang } from "@/lib/admin-lang";
import { AdminLangProvider } from "@/components/admin/AdminLang";
import LangSwitch from "@/components/admin/LangSwitch";
import { incomingReferral } from "@/lib/ambassadors-server";

const outfit = localFont({ src: "../fonts/outfit-normal-300-700.woff2", weight: "300 700", style: "normal", variable: "--font-outfit", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const title = t("Foliocrew — Tu talento merece su espacio", "Foliocrew — Your talent deserves its own space");
  return {
    title,
    description: t(
      "La plataforma para creadores de contenido y creadores UGC: portafolio profesional y bilingüe, media kit, link en bio, CRM de marcas, calendario con IA y reportes, en un solo lugar. Únete a la lista de espera.",
      "The platform for content creators and UGC creators: a professional bilingual portfolio, media kit, link in bio, brand CRM, AI calendar and reports, all in one place. Join the waitlist."
    ),
    openGraph: {
      title,
      description: t(
        "Portafolio, media kit y colaboraciones con marcas para creadores de contenido y UGC, en un solo lugar.",
        "Portfolio, media kit and brand collaborations for content and UGC creators, all in one place."
      ),
      type: "website",
    },
  };
}

const INK = "#251023";
const PLUM = "#7F207B";
const LAV = "#B692E7";

const SCATTERED = {
  es: ["Portafolio en Canva", "Links en Linktree", "Tratos en notas", "Pagos en WhatsApp", "Métricas en capturas", "Ideas en el celular"],
  en: ["Portfolio in Canva", "Links in Linktree", "Deals in notes", "Payments in WhatsApp", "Metrics in screenshots", "Ideas on your phone"],
};

const STEPS_EN = [
  { n: "1", title: "Create your account", text: "Pick your niche and our assistant builds your site in 10 minutes, with copy in Spanish and English." },
  { n: "2", title: "Show your best content", text: "Paste your Instagram, TikTok or Facebook videos and connect your accounts to bring in your real numbers." },
  { n: "3", title: "Share your link", text: "Send it to brands, put it in your bio and manage everything else from your dashboard." },
];

const STEPS = [
  { n: "1", title: "Crea tu cuenta", text: "Eliges tu nicho y nuestro asistente arma tu sitio en 10 minutos, con textos en español e inglés." },
  { n: "2", title: "Muestra tu mejor contenido", text: "Pega tus videos de Instagram, TikTok o Facebook y conecta tus redes para traer tus números reales." },
  { n: "3", title: "Comparte tu link", text: "Mándalo a las marcas, ponlo en tu bio y maneja todo lo demás desde tu panel." },
];

const TOOLS_EN = [
  { icon: "✨", title: "Bilingual portfolio", text: "Your professional site in Spanish and English, with your photo, your color and your content." },
  { icon: "📊", title: "Always up-to-date media kit", text: "One link with your numbers and your best work. Goodbye, outdated PDF." },
  { icon: "🤝", title: "Brand CRM", text: "What you agreed on, how much you're paid and when to follow up. It warns you when something's due." },
  { icon: "🗓️", title: "Calendar + AI", text: "Plan your month by network and get 3 captions written in your style and niche." },
  { icon: "📈", title: "Reports", text: "Your growth, your best day and time to post, and your income per brand. Monthly PDF report." },
  { icon: "💬", title: "One inbox", text: "Brand messages and Instagram comments in one place, with quick replies." },
  { icon: "🌐", title: "Your own domain", text: "Use yourname.foliocrew.pro or connect your own domain, like yourname.com." },
  { icon: "🔗", title: "Connected accounts", text: "Instagram, TikTok, Facebook and YouTube with official sign-in. Real metrics, not screenshots." },
  { icon: "🫶", title: "Creator community", text: "A private wall to ask, share tips and wins, and find collabs with creators of every kind." },
];

const TOOLS = [
  { icon: "✨", title: "Portafolio bilingüe", text: "Tu sitio profesional en español e inglés, con tu foto, tu color y tu contenido." },
  { icon: "📊", title: "Media kit siempre al día", text: "Un link con tus números y tu mejor trabajo. Adiós al PDF desactualizado." },
  { icon: "🤝", title: "CRM de marcas", text: "Qué acordaste, cuánto te pagan y cuándo hacer seguimiento. Te avisa si algo se vence." },
  { icon: "🗓️", title: "Calendario + IA", text: "Planea tu mes por red y pide 3 captions escritos con tu estilo y tu nicho." },
  { icon: "📈", title: "Reportes", text: "Tu crecimiento, tu mejor día y hora para publicar, y tus ingresos por marca. Reporte mensual en PDF." },
  { icon: "💬", title: "Bandeja única", text: "Los mensajes de marcas y los comentarios de Instagram en un solo lugar, con respuestas rápidas." },
  { icon: "🌐", title: "Tu propio dominio", text: "Usa tunombre.foliocrew.pro o conecta tu dominio, como tunombre.com." },
  { icon: "🔗", title: "Redes conectadas", text: "Instagram, TikTok, Facebook y YouTube con inicio de sesión oficial. Métricas reales, no capturas." },
  { icon: "🫶", title: "Comunidad de creadores", text: "Un muro privado para preguntar, compartir consejos y logros, y encontrar colaboraciones con creadores de todo tipo." },
];

const FAQ_EN = [
  { q: "Do I need to know design or code?", a: "No. The assistant builds your site and you edit it from your dashboard with simple forms. Every change shows up instantly." },
  { q: "Is it for influencers or for UGC?", a: "Both. If you post on your own accounts, your media kit shows your community and real numbers; if you do UGC, your portfolio shows the quality of your work. When you create your account you choose how you work and the assistant sets up your copy, services and packages for it." },
  { q: "Does it work if I have few followers?", a: "Yes. With UGC, brands post your content on their own accounts: quality matters, not followers. And if you're growing your community, a professional portfolio helps you land your first collaborations." },
  { q: "Can I use my own domain?", a: "Yes. You get yourname.foliocrew.pro and, if you want, you can connect a domain you buy (for example, yourname.com). The dashboard tells you exactly what to set up." },
  { q: "Does it post automatically to my accounts?", a: "Not yet. We help you plan your calendar, write your captions with AI and remind you when to post; you publish. Automatic publishing is on our roadmap." },
  { q: "How do I pay?", a: "For now with PayPal or bank transfer, for 1, 3 or 12 months (the yearly plan includes 2 free months). It doesn't renew automatically: we email you before it expires." },
  { q: "When does it open and how much is it?", a: "We're opening by invitation. The first to sign up get in sooner and at a special launch price. We'll email you." },
  { q: "Is my data safe?", a: "Your data and your brands' data are private: only you see them. Connections to your accounts use each network's official sign-in, and you can disconnect them anytime." },
];

const FAQ = [
  { q: "¿Necesito saber de diseño o de código?", a: "No. El asistente arma tu sitio y lo editas desde tu panel con formularios simples. Todo lo que cambias se ve al instante." },
  { q: "¿Es para influencers o para UGC?", a: "Para los dos. Si publicas en tus redes, tu media kit muestra tu comunidad y tus números reales; si haces UGC, tu portafolio muestra la calidad de tu trabajo. Al crear tu cuenta eliges cómo trabajas y el asistente arma tus textos, servicios y paquetes para eso." },
  { q: "¿Sirve si tengo pocos seguidores?", a: "Sí. Si haces UGC, las marcas publican tu contenido en sus propias redes: importa la calidad, no los seguidores. Y si estás creciendo tu comunidad, un portafolio profesional te ayuda a cerrar tus primeras colaboraciones." },
  { q: "¿Puedo usar mi propio dominio?", a: "Sí. Tienes tu dirección tunombre.foliocrew.pro y, si quieres, conectas un dominio que compres tú (por ejemplo, tunombre.com). El panel te dice exactamente qué configurar." },
  { q: "¿Publica automáticamente en mis redes?", a: "Todavía no. Te ayudamos a planear tu calendario, escribir tus captions con IA y recordarte cuándo publicar; tú publicas. La publicación automática está en nuestros planes." },
  { q: "¿Cómo se paga?", a: "Por ahora con PayPal o transferencia bancaria, por 1, 3 o 12 meses (el plan anual trae 2 meses de regalo). No se renueva solo: te avisamos por correo antes de que venza." },
  { q: "¿Cuándo abre y cuánto cuesta?", a: "Estamos abriendo por invitación. Quienes se anotan primero entran antes y con precio especial de lanzamiento. Te avisamos por correo." },
  { q: "¿Mis datos están seguros?", a: "Tus datos y los de tus marcas son privados: solo tú los ves. Las conexiones con tus redes usan el inicio de sesión oficial de cada red y puedes desconectarlas cuando quieras." },
];

function SitePhoneMockup({ lang }: { lang: AdminLang }) {
  const en = lang === "en";
  return (
    <div className="relative mx-auto w-[260px] sm:w-[290px]" aria-hidden>
      <div className="absolute -inset-6 -z-10 rotate-6 rounded-[48px] border-2 border-[#B692E7]/40" />
      <div className="rounded-[40px] border-[10px] border-[#251023] bg-[#FBF7F5] p-sp-3 shadow-[0_30px_60px_rgba(37,16,35,0.35)]">
        <div className="mb-sp-3 flex items-center justify-between">
          <span className="font-fraunces text-base font-semibold italic text-[#251023]">Valeria</span>
          <span className="rounded-full bg-[#B692E7]/30 px-sp-2 py-0.5 font-mono text-[8px] uppercase text-[#7F207B]">{en ? "Creator · Skincare" : "Creadora · Skincare"}</span>
        </div>
        <p className="font-fraunces text-xl font-semibold leading-tight text-[#251023]">
          {en ? (
            <>
              Real skin, real <em className="text-[#7F207B]">results</em>.
            </>
          ) : (
            <>
              Piel real, <em className="text-[#7F207B]">resultados</em> reales.
            </>
          )}
        </p>
        <div className="mt-sp-3 grid grid-cols-3 gap-1">
          {["from-[#B692E7] to-[#7F207B]", "from-[#F2B8CF] to-[#B692E7]", "from-[#7F207B] to-[#251023]"].map((g) => (
            <div key={g} className={`flex aspect-[9/16] items-end rounded-[10px] bg-gradient-to-br ${g} p-1`}>
              <span className="rounded-full bg-white/85 px-1 font-mono text-[7px] text-[#251023]">▶ 48K</span>
            </div>
          ))}
        </div>
        <div className="mt-sp-3 grid grid-cols-3 gap-1 text-center">
          {[
            ["12K", en ? "Audience" : "Audiencia"],
            ["6.8%", "Engagement"],
            ["24", en ? "Brands" : "Marcas"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-[8px] bg-white py-1">
              <p className="font-fraunces text-sm font-semibold text-[#7F207B]">{v}</p>
              <p className="text-[7px] uppercase text-[#251023]/55">{l}</p>
            </div>
          ))}
        </div>
        <div className="mt-sp-3 rounded-full bg-[#251023] py-sp-2 text-center text-[10px] font-semibold text-[#FBF7F5]">{en ? "Let's collaborate ✦" : "Colaboremos ✦"}</div>
        <p className="mt-sp-2 text-center font-mono text-[8px] text-[#251023]/45">valeria.foliocrew.pro</p>
      </div>
      <p className="mt-sp-3 text-center text-[11px] text-[#251023]/45">{en ? "Illustrative example" : "Ejemplo ilustrativo"}</p>
    </div>
  );
}

export default async function FoliocrewHome({
  searchParams,
}: {
  searchParams: Promise<{ utm_source?: string; utm_medium?: string; utm_campaign?: string; ref?: string }>;
}) {
  const sp = await searchParams;
  const referral = await incomingReferral(sp.ref);
  const utm: Utm = { utmSource: sp.utm_source, utmMedium: sp.utm_medium, utmCampaign: sp.utm_campaign };
  const prices = showPrices();
  const { t, lang } = await getT();
  const en = lang === "en";
  const steps = en ? STEPS_EN : STEPS;
  const tools = en ? TOOLS_EN : TOOLS;
  const faq = en ? FAQ_EN : FAQ;

  return (
    <AdminLangProvider lang={lang}>
    <div lang={lang} className={`${outfit.variable} bg-[#FBF7F5] text-[#251023]`} style={{ fontFamily: "var(--font-outfit), var(--font-inter), sans-serif" }}>
      <MetaPixel />

      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-[#251023]/10 bg-[#FBF7F5]/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-sp-4 px-sp-5 py-sp-3">
          <Link href="#inicio" aria-label="Foliocrew">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.svg" alt="Foliocrew" className="h-8 w-auto" />
          </Link>
          <div className="hidden items-center gap-sp-5 text-sm text-[#251023]/70 md:flex">
            <a href="#como-funciona" className="hover:text-[#7F207B]">{t("Cómo funciona", "How it works")}</a>
            <a href="#herramientas" className="hover:text-[#7F207B]">{t("Herramientas", "Features")}</a>
            <a href="#planes" className="hover:text-[#7F207B]">{t("Planes", "Plans")}</a>
            <a href="#preguntas" className="hover:text-[#7F207B]">{t("Preguntas", "FAQ")}</a>
          </div>
          <div className="flex items-center gap-sp-3">
            <LangSwitch tone="light" />
            <Link href="/admin/login" className="hidden text-sm font-semibold text-[#251023]/70 hover:text-[#7F207B] sm:inline">
              {t("Entrar", "Sign in")}
            </Link>
            <a href="#lista" className="hidden rounded-full bg-[#251023] px-sp-4 py-sp-2 text-sm font-semibold text-[#FBF7F5] hover:opacity-90 sm:inline-block">
              {t("Unirme a la lista", "Join the waitlist")}
            </a>
          </div>
        </nav>
      </header>

      {/* Portada */}
      <section id="inicio" className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-sp-6 px-sp-5 py-sp-6 md:grid-cols-[1.15fr_1fr] md:py-20">
          <div>
            <span className="inline-block rounded-full bg-[#B692E7]/25 px-sp-3 py-1 font-mono text-[11px] uppercase tracking-widest text-[#7F207B]">
              {t("Para creadores de contenido y UGC · Lanzamiento por invitación", "For content & UGC creators · Invite-only launch")}
            </span>
            <h1 className="mt-sp-4 font-fraunces text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
              {en ? (
                <>
                  Your talent deserves its own <em className="text-[#7F207B]">space.</em>
                </>
              ) : (
                <>
                  Tu talento merece su <em className="text-[#7F207B]">espacio.</em>
                </>
              )}
            </h1>
            <p className="mt-sp-5 max-w-xl text-lg text-[#251023]/70">
              {t(
                "Tu portafolio, tu media kit y tus colaboraciones con marcas, en un solo lugar. Un sitio profesional en español e inglés, y un panel para manejar tu negocio como creador.",
                "Your portfolio, your media kit and your brand collaborations, all in one place. A professional site in English and Spanish, plus a dashboard to run your creator business."
              )}
            </p>
            {referral && (
              <div className="mt-sp-5 max-w-xl rounded-[18px] border border-[#B692E7]/50 bg-[#B692E7]/15 p-sp-4">
                <p className="text-sm text-[#251023]/80">
                  {t("💜 Te invitó una embajadora de Foliocrew. Con su enlace puedes crear tu cuenta ahora, sin esperar.", "💜 A Foliocrew ambassador invited you. With their link you can create your account now, no waiting.")}
                </p>
                <Link href="/admin/registro" className="mt-sp-3 inline-block rounded-full bg-[#251023] px-sp-4 py-sp-2 text-sm font-semibold text-[#FBF7F5] hover:opacity-90">
                  {t("Crear mi cuenta", "Create my account")}
                </Link>
              </div>
            )}
            <div className="mt-sp-5 max-w-xl">
              <WaitlistForm utm={utm} compact />
            </div>
          </div>
          <SitePhoneMockup lang={lang} />
        </div>
      </section>

      {/* El problema */}
      <section className="bg-[#251023] text-[#FBF7F5]">
        <div className="mx-auto max-w-6xl px-sp-5 py-sp-6 md:py-20">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#B692E7]">{t("El problema", "The problem")}</p>
          <h2 className="mt-sp-3 max-w-3xl font-fraunces text-4xl font-semibold leading-tight sm:text-5xl">
            {t("Seis apps sueltas para un solo negocio.", "Six scattered apps for one business.")}{" "}
            <em className="text-[#B692E7]">{t("Te entendemos.", "We get it.")}</em>
          </h2>
          <div className="mt-sp-6 flex flex-wrap gap-sp-2">
            {SCATTERED[lang].map((item) => (
              <span key={item} className="rounded-full border border-[#FBF7F5]/20 px-sp-4 py-sp-2 text-sm text-[#FBF7F5]/75 line-through decoration-[#B692E7]/70">
                {item}
              </span>
            ))}
          </div>
          <p className="mt-sp-6 max-w-2xl text-lg text-[#FBF7F5]/75">
            {t(
              "El portafolio se ve amateur, los seguimientos se pierden, los pagos se olvidan y nunca sabes qué números mostrarle a una marca.",
              "Your portfolio looks amateur, follow-ups get lost, payments get forgotten and you never know which numbers to show a brand."
            )}{" "}
            <strong className="text-[#FBF7F5]">{t("Foliocrew lo junta todo y lo hace verse profesional.", "Foliocrew brings it all together and makes it look professional.")}</strong>
          </p>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-sp-5 py-sp-6 md:py-20">
        <p className="font-mono text-[11px] uppercase tracking-widest text-[#7F207B]">{t("Cómo funciona", "How it works")}</p>
        <h2 className="mt-sp-3 font-fraunces text-4xl font-semibold sm:text-5xl">
          {t("Crea. Conecta.", "Create. Connect.")} <em className="text-[#7F207B]">{t("Crece.", "Grow.")}</em>
        </h2>
        <ol className="mt-sp-6 grid gap-sp-4 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="rounded-[22px] border border-[#251023]/10 bg-white p-sp-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B692E7]/30 font-fraunces text-lg font-semibold text-[#7F207B]">{s.n}</span>
              <h3 className="mt-sp-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-sp-1 text-[#251023]/65">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Herramientas */}
      <section id="herramientas" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-6xl px-sp-5 py-sp-6 md:py-20">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#7F207B]">{t("Todo lo que incluye", "Everything included")}</p>
          <h2 className="mt-sp-3 max-w-3xl font-fraunces text-4xl font-semibold leading-tight sm:text-5xl">
            {t("Muestra tu trabajo.", "Show your work.")} <em className="text-[#7F207B]">{t("Maneja tu negocio.", "Run your business.")}</em>
          </h2>
          <div className="mt-sp-6 grid gap-sp-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <div key={tool.title} className="rounded-[22px] bg-[#FBF7F5] p-sp-5">
                <span className="text-2xl" aria-hidden>
                  {tool.icon}
                </span>
                <h3 className="mt-sp-2 font-semibold">{tool.title}</h3>
                <p className="mt-sp-1 text-sm text-[#251023]/65">{tool.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quién */}
      <section className="mx-auto max-w-6xl px-sp-5 py-sp-6 md:py-20">
        <p className="font-mono text-[11px] uppercase tracking-widest text-[#7F207B]">{t("Para quién es", "Who it's for")}</p>
        <div className="mt-sp-5 grid gap-sp-4 md:grid-cols-2">
          <div className="rounded-[22px] border border-[#251023]/10 bg-white p-sp-6">
            <p className="font-fraunces text-2xl font-semibold">{t("Si estás empezando", "If you're just starting")}</p>
            <p className="mt-sp-2 text-[#251023]/65">
              {t(
                "Tienes pocas marcas (o ninguna todavía) y tu portafolio vive en Canva. Con Foliocrew te ves profesional desde el primer día:",
                "You have few brands (or none yet) and your portfolio lives in Canva. With Foliocrew you look professional from day one:"
              )}{" "}
              <em>{t("que tu portafolio hable por ti.", "let your portfolio speak for you.")}</em>
            </p>
          </div>
          <div className="rounded-[22px] p-sp-6 text-[#FBF7F5]" style={{ background: PLUM }}>
            <p className="font-fraunces text-2xl font-semibold">{t("Si ya facturas", "If you're already earning")}</p>
            <p className="mt-sp-2 text-[#FBF7F5]/80">
              {t(
                "Trabajas con varias marcas al mes y todo está en notas y Excel. Con Foliocrew ordenas tratos, pagos y entregas, y llegas a cada marca con tus números:",
                "You work with several brands a month and everything lives in notes and spreadsheets. With Foliocrew you organize deals, payments and deliverables, and show up to every brand with your numbers:"
              )}{" "}
              <em>{t("maneja tus marcas como un negocio.", "run your brand deals like a business.")}</em>
            </p>
          </div>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-6xl px-sp-5 py-sp-6 md:py-20">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#7F207B]">{t("Planes", "Plans")}</p>
          <h2 className="mt-sp-3 font-fraunces text-4xl font-semibold sm:text-5xl">{t("Elige tu espacio", "Choose your space")}</h2>
          <p className="mt-sp-2 text-[#251023]/65">
            {prices
              ? t("Precios en USD por mes. Cancela cuando quieras.", "Prices in USD per month. Cancel anytime.")
              : t("Precio especial de lanzamiento para quienes se anotan primero.", "Special launch price for early sign-ups.")}
          </p>
          <div className="mt-sp-6 grid gap-sp-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`flex flex-col rounded-[22px] p-sp-6 ${plan.highlight ? "text-[#FBF7F5]" : "border border-[#251023]/10 bg-[#FBF7F5]"}`}
                style={plan.highlight ? { background: INK } : undefined}
              >
                {plan.highlight && (
                  <span className="mb-sp-2 self-start rounded-full px-sp-3 py-0.5 font-mono text-[10px] uppercase" style={{ background: LAV, color: INK }}>
                    {t("El más completo", "Most complete")}
                  </span>
                )}
                <p className="font-fraunces text-2xl font-semibold">{plan.name}</p>
                <p className={`mt-sp-1 text-sm ${plan.highlight ? "text-[#FBF7F5]/70" : "text-[#251023]/60"}`}>{en ? plan.taglineEn : plan.tagline}</p>
                <p className="mt-sp-4 font-fraunces text-4xl font-semibold">
                  {prices ? (
                    <>
                      ${plan.price}
                      <span className="text-base font-normal opacity-60">{t("/mes", "/mo")}</span>
                    </>
                  ) : (
                    <span className="text-xl">{t("Precio de lanzamiento", "Launch price")}</span>
                  )}
                </p>
                <ul className="mt-sp-4 flex flex-1 flex-col gap-sp-2 text-sm">
                  {(en ? plan.featuresEn : plan.features).map((f) => (
                    <li key={f} className="flex gap-sp-2">
                      <span aria-hidden style={{ color: plan.highlight ? LAV : PLUM }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#lista"
                  className={`mt-sp-5 rounded-full py-sp-3 text-center font-semibold ${plan.highlight ? "text-[#251023]" : "text-[#FBF7F5]"}`}
                  style={{ background: plan.highlight ? LAV : INK }}
                >
                  {t("Unirme a la lista", "Join the waitlist")}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preguntas */}
      <section id="preguntas" className="mx-auto max-w-3xl scroll-mt-20 px-sp-5 py-sp-6 md:py-20">
        <p className="font-mono text-[11px] uppercase tracking-widest text-[#7F207B]">{t("Preguntas frecuentes", "FAQ")}</p>
        <h2 className="mt-sp-3 font-fraunces text-4xl font-semibold">{t("Lo que nos preguntan", "What people ask us")}</h2>
        <div className="mt-sp-5 flex flex-col gap-sp-2">
          {faq.map((f) => (
            <details key={f.q} className="group rounded-[16px] border border-[#251023]/10 bg-white px-sp-5 py-sp-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-sp-3 font-semibold">
                {f.q}
                <span aria-hidden className="text-[#7F207B] transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-sp-2 text-[#251023]/70">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Cierre con la lista */}
      <section id="lista" className="scroll-mt-20 bg-[#251023] text-[#FBF7F5]">
        <div className="mx-auto grid max-w-6xl items-center gap-sp-6 px-sp-5 py-sp-6 md:grid-cols-2 md:py-20">
          <div>
            <h2 className="font-fraunces text-4xl font-semibold leading-tight sm:text-5xl">
              {t("Las marcas te están buscando.", "Brands are looking for you.")}{" "}
              <em className="text-[#B692E7]">{t("Que te encuentren.", "Let them find you.")}</em>
            </h2>
            <p className="mt-sp-4 text-lg text-[#FBF7F5]/70">
              {t(
                "Únete a la lista de espera. Quienes se anotan primero entran antes y con precio especial de lanzamiento.",
                "Join the waitlist. Early sign-ups get in sooner and at a special launch price."
              )}
            </p>
          </div>
          <WaitlistForm utm={utm} dark />
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-sp-4 px-sp-5 py-sp-5 text-sm text-[#251023]/55">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt="Foliocrew" className="h-6 w-auto" />
        <div className="flex flex-wrap gap-sp-4">
          <Link href="/privacidad" className="hover:text-[#7F207B]">{t("Privacidad", "Privacy")}</Link>
          <Link href="/terminos" className="hover:text-[#7F207B]">{t("Términos", "Terms")}</Link>
          <Link href="/admin/login" className="hover:text-[#7F207B]">{t("Entrar", "Sign in")}</Link>
        </div>
        <p>© {new Date().getFullYear()} Foliocrew · {t("Crea. Conecta. Crece.", "Create. Connect. Grow.")}</p>
      </footer>
    </div>
    </AdminLangProvider>
  );
}
