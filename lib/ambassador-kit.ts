import type { AdminLang } from "./admin-lang";
import { AMBASSADOR } from "./ambassadors";

// Kit para compartir de la embajadora (G3): textos listos para copiar. Todos dicen que es publicidad
// AL INICIO (#publicidad / #ad) y que ella es embajadora de Foliocrew, porque recibe beneficios por invitar.
// Se prueba en tests/ambassadors.test.ts con lib/disclosure.ts (que ningún texto salga sin aviso claro).

export interface KitText {
  id: string;
  title: string;
  text: string;
}

export function kitTexts(link: string, lang: AdminLang): KitText[] {
  if (lang === "en") {
    return [
      {
        id: "post",
        title: "Post or caption",
        text: `#ad I'm a Foliocrew ambassador. I use it to run my portfolio, media kit and brand deals in one place. If you're a creator, you can join with my link: ${link}`,
      },
      {
        id: "story",
        title: "Story",
        text: `#ad Foliocrew ambassador 💜 This is where I keep my portfolio, media kit and brand deals. Create yours with my link: ${link}`,
      },
      {
        id: "dm",
        title: "Direct message",
        text: `Hi! Quick disclosure: I'm a Foliocrew ambassador, so I get a free month if you sign up with my link and stay. I use it for my portfolio, media kit and brand deals, and I think it could help you too: ${link}`,
      },
    ];
  }
  return [
    {
      id: "post",
      title: "Publicación o caption",
      text: `#publicidad Soy embajadora de Foliocrew. Lo uso para manejar mi portafolio, mi media kit y mis tratos con marcas en un solo lugar. Si eres creadora, puedes entrar con mi enlace: ${link}`,
    },
    {
      id: "story",
      title: "Historia",
      text: `#publicidad Embajadora de Foliocrew 💜 Aquí tengo mi portafolio, mi media kit y mis tratos con marcas. Crea el tuyo con mi enlace: ${link}`,
    },
    {
      id: "dm",
      title: "Mensaje directo",
      text: `¡Hola! Te aviso desde el principio: soy embajadora de Foliocrew, así que gano un mes gratis si te registras con mi enlace y te quedas. Lo uso para mi portafolio, mi media kit y mis tratos con marcas, y creo que te puede servir: ${link}`,
    },
  ];
}

/** Las reglas del programa en simple (ES/EN), con los parámetros reales. */
export function programRules(lang: AdminLang) {
  const { rewardMonths, waitDays, cookieDays } = AMBASSADOR;
  if (lang === "en") {
    return [
      `Each person who signs up with your link and pays their first month earns you ${rewardMonths} free month, ${waitDays} days after that first payment (as long as their account is still active).`,
      "Months add up and extend your plan. You can't earn them from your own accounts, free trials or complimentary accounts.",
      `Your link remembers the visitor for ${cookieDays} days.`,
      "You only see how many people registered and how many pay, never their names or emails.",
      "Always say you're an ambassador when you share your link (#ad / #publicidad). The texts in the kit already do.",
      "The Foliocrew team can remove the tier at any time; your account goes back to its normal plan and the months you already earned stay.",
    ];
  }
  return [
    `Cada persona que se registra con tu enlace y paga su primer mes te da ${rewardMonths} mes gratis, ${waitDays} días después de ese primer pago (mientras su cuenta siga activa).`,
    "Los meses se acumulan y alargan tu plan. No cuentan tus propias cuentas, las pruebas gratis ni las cuentas de cortesía.",
    `Tu enlace recuerda a la persona que lo abrió por ${cookieDays} días.`,
    "Solo ves cuántas personas se registraron y cuántas pagan, nunca sus nombres ni correos.",
    "Cuando compartas tu enlace di siempre que eres embajadora (#publicidad / #ad). Los textos del kit ya lo hacen.",
    "El equipo de Foliocrew puede quitar el nivel cuando quiera; tu cuenta vuelve a su plan normal y los meses que ya ganaste se conservan.",
  ];
}
