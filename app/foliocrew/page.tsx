import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { PLANS, showPrices } from "@/lib/plans";
import WaitlistForm, { type Utm } from "./WaitlistForm";
import MetaPixel from "./MetaPixel";

const outfit = localFont({ src: "../fonts/outfit-normal-300-700.woff2", weight: "300 700", style: "normal", variable: "--font-outfit", display: "swap" });

export const metadata: Metadata = {
  title: "Foliocrew — Tu talento merece su espacio",
  description:
    "La plataforma para creadores de contenido y creadores UGC: portafolio profesional y bilingüe, media kit, link en bio, CRM de marcas, calendario con IA y reportes, en un solo lugar. Únete a la lista de espera.",
  openGraph: { title: "Foliocrew — Tu talento merece su espacio", description: "Portafolio, media kit y colaboraciones con marcas para creadores de contenido y UGC, en un solo lugar.", type: "website" },
};

const INK = "#251023";
const PLUM = "#7F207B";
const LAV = "#B692E7";

const SCATTERED = ["Portafolio en Canva", "Links en Linktree", "Tratos en notas", "Pagos en WhatsApp", "Métricas en capturas", "Ideas en el celular"];

const STEPS = [
  { n: "1", title: "Crea tu cuenta", text: "Eliges tu nicho y nuestro asistente arma tu sitio en 10 minutos, con textos en español e inglés." },
  { n: "2", title: "Muestra tu mejor contenido", text: "Pega tus videos de Instagram, TikTok o Facebook y conecta tus redes para traer tus números reales." },
  { n: "3", title: "Comparte tu link", text: "Mándalo a las marcas, ponlo en tu bio y maneja todo lo demás desde tu panel." },
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

function SitePhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[290px]" aria-hidden>
      <div className="absolute -inset-6 -z-10 rotate-6 rounded-[48px] border-2 border-[#B692E7]/40" />
      <div className="rounded-[40px] border-[10px] border-[#251023] bg-[#FBF7F5] p-sp-3 shadow-[0_30px_60px_rgba(37,16,35,0.35)]">
        <div className="mb-sp-3 flex items-center justify-between">
          <span className="font-fraunces text-base font-semibold italic text-[#251023]">Valeria</span>
          <span className="rounded-full bg-[#B692E7]/30 px-sp-2 py-0.5 font-mono text-[8px] uppercase text-[#7F207B]">Creadora · Skincare</span>
        </div>
        <p className="font-fraunces text-xl font-semibold leading-tight text-[#251023]">
          Piel real, <em className="text-[#7F207B]">resultados</em> reales.
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
            ["12K", "Audiencia"],
            ["6.8%", "Engagement"],
            ["24", "Marcas"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-[8px] bg-white py-1">
              <p className="font-fraunces text-sm font-semibold text-[#7F207B]">{v}</p>
              <p className="text-[7px] uppercase text-[#251023]/55">{l}</p>
            </div>
          ))}
        </div>
        <div className="mt-sp-3 rounded-full bg-[#251023] py-sp-2 text-center text-[10px] font-semibold text-[#FBF7F5]">Colaboremos ✦</div>
        <p className="mt-sp-2 text-center font-mono text-[8px] text-[#251023]/45">valeria.foliocrew.pro</p>
      </div>
      <p className="mt-sp-3 text-center text-[11px] text-[#251023]/45">Ejemplo ilustrativo</p>
    </div>
  );
}

export default async function FoliocrewHome({
  searchParams,
}: {
  searchParams: Promise<{ utm_source?: string; utm_medium?: string; utm_campaign?: string }>;
}) {
  const sp = await searchParams;
  const utm: Utm = { utmSource: sp.utm_source, utmMedium: sp.utm_medium, utmCampaign: sp.utm_campaign };
  const prices = showPrices();

  return (
    <div className={`${outfit.variable} bg-[#FBF7F5] text-[#251023]`} style={{ fontFamily: "var(--font-outfit), var(--font-inter), sans-serif" }}>
      <MetaPixel />

      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-[#251023]/10 bg-[#FBF7F5]/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-sp-4 px-sp-5 py-sp-3">
          <Link href="#inicio" aria-label="Foliocrew">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.svg" alt="Foliocrew" className="h-8 w-auto" />
          </Link>
          <div className="hidden items-center gap-sp-5 text-sm text-[#251023]/70 md:flex">
            <a href="#como-funciona" className="hover:text-[#7F207B]">Cómo funciona</a>
            <a href="#herramientas" className="hover:text-[#7F207B]">Herramientas</a>
            <a href="#planes" className="hover:text-[#7F207B]">Planes</a>
            <a href="#preguntas" className="hover:text-[#7F207B]">Preguntas</a>
          </div>
          <div className="flex items-center gap-sp-3">
            <Link href="/admin/login" className="hidden text-sm font-semibold text-[#251023]/70 hover:text-[#7F207B] sm:inline">
              Entrar
            </Link>
            <a href="#lista" className="rounded-full bg-[#251023] px-sp-4 py-sp-2 text-sm font-semibold text-[#FBF7F5] hover:opacity-90">
              Unirme a la lista
            </a>
          </div>
        </nav>
      </header>

      {/* Portada */}
      <section id="inicio" className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-sp-6 px-sp-5 py-sp-6 md:grid-cols-[1.15fr_1fr] md:py-20">
          <div>
            <span className="inline-block rounded-full bg-[#B692E7]/25 px-sp-3 py-1 font-mono text-[11px] uppercase tracking-widest text-[#7F207B]">
              Para creadores de contenido y UGC · Lanzamiento por invitación
            </span>
            <h1 className="mt-sp-4 font-fraunces text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
              Tu talento merece su <em className="text-[#7F207B]">espacio.</em>
            </h1>
            <p className="mt-sp-5 max-w-xl text-lg text-[#251023]/70">
              Tu portafolio, tu media kit y tus colaboraciones con marcas, en un solo lugar. Un sitio profesional en español e inglés, y un
              panel para manejar tu negocio como creador.
            </p>
            <div className="mt-sp-5 max-w-xl">
              <WaitlistForm utm={utm} compact />
            </div>
          </div>
          <SitePhoneMockup />
        </div>
      </section>

      {/* El problema */}
      <section className="bg-[#251023] text-[#FBF7F5]">
        <div className="mx-auto max-w-6xl px-sp-5 py-sp-6 md:py-20">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#B692E7]">El problema</p>
          <h2 className="mt-sp-3 max-w-3xl font-fraunces text-4xl font-semibold leading-tight sm:text-5xl">
            Seis apps sueltas para un solo negocio. <em className="text-[#B692E7]">Te entendemos.</em>
          </h2>
          <div className="mt-sp-6 flex flex-wrap gap-sp-2">
            {SCATTERED.map((item) => (
              <span key={item} className="rounded-full border border-[#FBF7F5]/20 px-sp-4 py-sp-2 text-sm text-[#FBF7F5]/75 line-through decoration-[#B692E7]/70">
                {item}
              </span>
            ))}
          </div>
          <p className="mt-sp-6 max-w-2xl text-lg text-[#FBF7F5]/75">
            El portafolio se ve amateur, los seguimientos se pierden, los pagos se olvidan y nunca sabes qué números mostrarle a una marca.{" "}
            <strong className="text-[#FBF7F5]">Foliocrew lo junta todo y lo hace verse profesional.</strong>
          </p>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-sp-5 py-sp-6 md:py-20">
        <p className="font-mono text-[11px] uppercase tracking-widest text-[#7F207B]">Cómo funciona</p>
        <h2 className="mt-sp-3 font-fraunces text-4xl font-semibold sm:text-5xl">
          Crea. Conecta. <em className="text-[#7F207B]">Crece.</em>
        </h2>
        <ol className="mt-sp-6 grid gap-sp-4 md:grid-cols-3">
          {STEPS.map((s) => (
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
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#7F207B]">Todo lo que incluye</p>
          <h2 className="mt-sp-3 max-w-3xl font-fraunces text-4xl font-semibold leading-tight sm:text-5xl">
            Muestra tu trabajo. <em className="text-[#7F207B]">Maneja tu negocio.</em>
          </h2>
          <div className="mt-sp-6 grid gap-sp-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((t) => (
              <div key={t.title} className="rounded-[22px] bg-[#FBF7F5] p-sp-5">
                <span className="text-2xl" aria-hidden>
                  {t.icon}
                </span>
                <h3 className="mt-sp-2 font-semibold">{t.title}</h3>
                <p className="mt-sp-1 text-sm text-[#251023]/65">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quién */}
      <section className="mx-auto max-w-6xl px-sp-5 py-sp-6 md:py-20">
        <p className="font-mono text-[11px] uppercase tracking-widest text-[#7F207B]">Para quién es</p>
        <div className="mt-sp-5 grid gap-sp-4 md:grid-cols-2">
          <div className="rounded-[22px] border border-[#251023]/10 bg-white p-sp-6">
            <p className="font-fraunces text-2xl font-semibold">Si estás empezando</p>
            <p className="mt-sp-2 text-[#251023]/65">
              Tienes pocas marcas (o ninguna todavía) y tu portafolio vive en Canva. Con Foliocrew te ves profesional desde el primer día:{" "}
              <em>que tu portafolio hable por ti.</em>
            </p>
          </div>
          <div className="rounded-[22px] p-sp-6 text-[#FBF7F5]" style={{ background: PLUM }}>
            <p className="font-fraunces text-2xl font-semibold">Si ya facturas</p>
            <p className="mt-sp-2 text-[#FBF7F5]/80">
              Trabajas con varias marcas al mes y todo está en notas y Excel. Con Foliocrew ordenas tratos, pagos y entregas, y llegas a cada
              marca con tus números: <em>maneja tus marcas como un negocio.</em>
            </p>
          </div>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-6xl px-sp-5 py-sp-6 md:py-20">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#7F207B]">Planes</p>
          <h2 className="mt-sp-3 font-fraunces text-4xl font-semibold sm:text-5xl">Elige tu espacio</h2>
          <p className="mt-sp-2 text-[#251023]/65">
            {prices ? "Precios en USD por mes. Cancela cuando quieras." : "Precio especial de lanzamiento para quienes se anotan primero."}
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
                    El más completo
                  </span>
                )}
                <p className="font-fraunces text-2xl font-semibold">{plan.name}</p>
                <p className={`mt-sp-1 text-sm ${plan.highlight ? "text-[#FBF7F5]/70" : "text-[#251023]/60"}`}>{plan.tagline}</p>
                <p className="mt-sp-4 font-fraunces text-4xl font-semibold">
                  {prices ? (
                    <>
                      ${plan.price}
                      <span className="text-base font-normal opacity-60">/mes</span>
                    </>
                  ) : (
                    <span className="text-xl">Precio de lanzamiento</span>
                  )}
                </p>
                <ul className="mt-sp-4 flex flex-1 flex-col gap-sp-2 text-sm">
                  {plan.features.map((f) => (
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
                  Unirme a la lista
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preguntas */}
      <section id="preguntas" className="mx-auto max-w-3xl scroll-mt-20 px-sp-5 py-sp-6 md:py-20">
        <p className="font-mono text-[11px] uppercase tracking-widest text-[#7F207B]">Preguntas frecuentes</p>
        <h2 className="mt-sp-3 font-fraunces text-4xl font-semibold">Lo que nos preguntan</h2>
        <div className="mt-sp-5 flex flex-col gap-sp-2">
          {FAQ.map((f) => (
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
              Las marcas te están buscando. <em className="text-[#B692E7]">Que te encuentren.</em>
            </h2>
            <p className="mt-sp-4 text-lg text-[#FBF7F5]/70">
              Únete a la lista de espera. Quienes se anotan primero entran antes y con precio especial de lanzamiento.
            </p>
          </div>
          <WaitlistForm utm={utm} dark />
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-sp-4 px-sp-5 py-sp-5 text-sm text-[#251023]/55">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt="Foliocrew" className="h-6 w-auto" />
        <div className="flex flex-wrap gap-sp-4">
          <Link href="/privacidad" className="hover:text-[#7F207B]">Privacidad</Link>
          <Link href="/terminos" className="hover:text-[#7F207B]">Términos</Link>
          <Link href="/admin/login" className="hover:text-[#7F207B]">Entrar</Link>
        </div>
        <p>© {new Date().getFullYear()} Foliocrew · Crea. Conecta. Crece.</p>
      </footer>
    </div>
  );
}
