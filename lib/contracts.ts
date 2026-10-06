import { calendarDays, formatCents } from "./invoices";

// Contrato simple con una marca (B4). Todo lo que genera el texto es una función pura (se prueba en
// tests/contracts.test.ts). El texto es una PLANTILLA DE REFERENCIA, no asesoría legal.

export type ContractTemplate = "sponsored" | "ugc" | "ambassador" | "affiliate";
export type ContractStatus = "draft" | "sent" | "accepted" | "declined";

export const CONTRACT_TEMPLATES: { id: ContractTemplate; label: string; labelEn: string; hint: string; hintEn: string }[] = [
  {
    id: "sponsored",
    label: "Publicación patrocinada",
    labelEn: "Sponsored post",
    hint: "Publicas en tus redes y la marca te paga.",
    hintEn: "You post on your channels and the brand pays you.",
  },
  {
    id: "ugc",
    label: "UGC sin publicar",
    labelEn: "UGC (not posted)",
    hint: "Creas contenido para que la marca lo use en sus canales y anuncios.",
    hintEn: "You create content for the brand to use on its channels and ads.",
  },
  {
    id: "ambassador",
    label: "Embajador mensual",
    labelEn: "Monthly ambassador",
    hint: "Colaboración de varios meses con un pago mensual.",
    hintEn: "A multi-month partnership with a monthly fee.",
  },
  {
    id: "affiliate",
    label: "Afiliado (comisión)",
    labelEn: "Affiliate (commission)",
    hint: "Ganas un % de las ventas que salen de tu enlace.",
    hintEn: "You earn a % of the sales that come from your link.",
  },
];

export const CONTRACT_STATUS_META: Record<ContractStatus, { label: string; labelEn: string; className: string }> = {
  draft: { label: "Borrador", labelEn: "Draft", className: "bg-cream text-ink/70" },
  sent: { label: "Enviado", labelEn: "Sent", className: "bg-cobalt/15 text-cobalt-ink" },
  accepted: { label: "Aceptado", labelEn: "Accepted", className: "bg-lime/40 text-moss" },
  declined: { label: "Con cambios pedidos", labelEn: "Changes requested", className: "bg-coral/15 text-coral" },
};

export const CONTRACT_DISCLAIMER = {
  es: "Plantilla de referencia. Foliocrew no es un despacho legal; para acuerdos grandes consulta a un abogado.",
  en: "Reference template. Foliocrew is not a law firm; for large agreements, consult a lawyer.",
};

export type ContractTerms = {
  template: ContractTemplate;
  /** Qué se entrega: una línea por entregable. */
  deliverables: string[];
  /** Fecha de entrega "YYYY-MM-DD" ("" si no hay una fecha fija). */
  deliveryDate: string;
  /** Monto en centavos: total del trabajo, o por mes en "embajador". 0 en "afiliado". */
  fee: number;
  currency: string;
  /** % que se paga antes de empezar (0 = sin anticipo). */
  depositPercent: number;
  /** Días para pagar después de recibir la factura. */
  paymentDays: number;
  /** Duración en meses (solo "embajador"). */
  months: number;
  /** % de comisión sobre las ventas netas (solo "afiliado"). */
  commissionPercent: number;
  /** Días que la marca puede usar el contenido (0 = sin licencia extra). */
  usageDays: number;
  exclusivityDays: number;
  exclusivityCategory: string;
  whitelisting: boolean;
  /** Rondas de cambios incluidas. */
  revisions: number;
  /** Días de aviso por escrito para cancelar. */
  cancelNoticeDays: number;
  /** % del monto que se cobra si la marca cancela con el trabajo ya reservado (0 = ninguno). */
  killFeePercent: number;
  /** Condiciones adicionales en texto libre. */
  extra: string;
};

export type ContractParty = { name: string; company?: string; location?: string; email?: string };
export type ContractParties = { creator: ContractParty; brand: ContractParty };

export function emptyTerms(template: ContractTemplate): ContractTerms {
  return {
    template,
    deliverables: [],
    deliveryDate: "",
    fee: 0,
    currency: "USD",
    depositPercent: template === "affiliate" ? 0 : 50,
    paymentDays: 15,
    months: template === "ambassador" ? 3 : 0,
    commissionPercent: template === "affiliate" ? 10 : 0,
    usageDays: template === "ugc" ? 90 : 0,
    exclusivityDays: 0,
    exclusivityCategory: "",
    whitelisting: false,
    revisions: 2,
    cancelNoticeDays: 7,
    killFeePercent: template === "affiliate" ? 0 : 25,
    extra: "",
  };
}

export function isContractTemplate(v: unknown): v is ContractTemplate {
  return v === "sponsored" || v === "ugc" || v === "ambassador" || v === "affiliate";
}

export type ContractSection = { heading: string; paragraphs: string[] };
export type GeneratedContract = { title: string; sections: ContractSection[] };

type Lang = "es" | "en";

function longDate(value: string, lang: Lang) {
  const d = new Date(`${value}T12:00:00.000Z`);
  return d.toLocaleDateString(lang === "en" ? "en-US" : "es-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Genera el contrato a partir de los huecos. Solo incluye las cláusulas que aplican. */
export function generateContract(terms: ContractTerms, parties: ContractParties, lang: Lang): GeneratedContract {
  const es = lang === "es";
  const T = (a: string, b: string) => (es ? a : b);
  const money = (cents: number) => formatCents(cents, terms.currency, lang);
  const t = terms;
  const brandName = parties.brand.company || parties.brand.name || T("la marca", "the brand");
  const creatorName = parties.creator.name || T("la persona creadora", "the creator");
  const days = (n: number) => `${n} ${plural(n, T("día", "day"), T("días", "days"))}`;
  const rights = t.usageDays > 0 ? t.usageDays : 0;
  const posts = t.template === "sponsored" || t.template === "ambassador" || t.template === "affiliate";

  const title = {
    sponsored: T("Acuerdo de publicación patrocinada", "Sponsored post agreement"),
    ugc: T("Acuerdo de creación de contenido (UGC)", "Content creation (UGC) agreement"),
    ambassador: T("Acuerdo de embajador de marca", "Brand ambassador agreement"),
    affiliate: T("Acuerdo de afiliado", "Affiliate agreement"),
  }[t.template];

  const sections: ContractSection[] = [];
  const add = (heading: string, ...paragraphs: (string | false | undefined | "")[]) => {
    const list = paragraphs.filter((p): p is string => Boolean(p));
    // Se numeran en orden, así no hay saltos cuando una cláusula no aplica.
    if (list.length) sections.push({ heading: `${sections.length + 1}. ${heading}`, paragraphs: list });
  };

  // 1. Partes
  add(
    T("Las partes", "The parties"),
    T(
      `Este acuerdo es entre ${creatorName}${parties.creator.location ? ` (${parties.creator.location})` : ""}, en adelante «la persona creadora», y ${brandName}${
        parties.brand.company && parties.brand.name ? `, representada por ${parties.brand.name}` : ""
      }, en adelante «la marca».`,
      `This agreement is between ${creatorName}${parties.creator.location ? ` (${parties.creator.location})` : ""}, “the creator”, and ${brandName}${
        parties.brand.company && parties.brand.name ? `, represented by ${parties.brand.name}` : ""
      }, “the brand”.`
    )
  );

  // 2. Objeto
  add(
    T("Qué se acuerda", "What is agreed"),
    {
      sponsored: T(
        "La persona creadora creará y publicará contenido sobre la marca en sus propias cuentas, y la marca le pagará por ello.",
        "The creator will create and publish content about the brand on their own accounts, and the brand will pay for it."
      ),
      ugc: T(
        "La persona creadora creará contenido para que la marca lo use en sus propios canales y anuncios. El contenido no se publica en las cuentas de la persona creadora, salvo que se acuerde por escrito.",
        "The creator will create content for the brand to use on its own channels and ads. The content is not posted on the creator's accounts unless agreed in writing."
      ),
      ambassador: T(
        `La persona creadora será embajadora de la marca durante ${t.months || 1} ${plural(t.months || 1, "mes", "meses")}, creando y publicando contenido sobre la marca en sus propias cuentas.`,
        `The creator will be a brand ambassador for ${t.months || 1} ${plural(t.months || 1, "month", "months")}, creating and publishing content about the brand on their own accounts.`
      ),
      affiliate: T(
        "La persona creadora promoverá los productos de la marca en sus propias cuentas con un enlace o código único, y ganará una comisión por las ventas que vengan de ese enlace o código.",
        "The creator will promote the brand's products on their own accounts with a unique link or code, and will earn a commission on the sales that come from that link or code."
      ),
    }[t.template]
  );

  // 3. Entregables y fechas
  const items = t.deliverables.map((d) => d.trim()).filter(Boolean);
  add(
    T("Entregables y fechas", "Deliverables and dates"),
    items.length > 0 && T(t.template === "ambassador" ? "Cada mes la persona creadora entregará:" : "La persona creadora entregará:", t.template === "ambassador" ? "Each month the creator will deliver:" : "The creator will deliver:"),
    ...items.map((d) => `- ${d}`),
    t.deliveryDate && T(`Fecha de entrega: ${longDate(t.deliveryDate, lang)}.`, `Delivery date: ${longDate(t.deliveryDate, lang)}.`),
    items.length === 0 && !t.deliveryDate && T("Los entregables y las fechas se acordarán por escrito (correo o mensaje).", "Deliverables and dates will be agreed in writing (email or message).")
  );

  // 4. Revisiones
  if (t.template !== "affiliate") {
    add(
      T("Revisiones", "Revisions"),
      T(
        `Se incluyen ${t.revisions} ${plural(t.revisions, "ronda de cambios", "rondas de cambios")} por entregable. La marca enviará sus cambios juntos y por escrito. Los cambios adicionales o un cambio de rumbo después de aprobar el contenido se cotizan aparte.`,
        `${t.revisions} ${plural(t.revisions, "round", "rounds")} of changes per deliverable ${plural(t.revisions, "is", "are")} included. The brand will send its changes together and in writing. Additional changes, or a change of direction after the content is approved, are quoted separately.`
      )
    );
  }

  // 5. Pago
  const total = t.template === "ambassador" ? t.fee * Math.max(1, t.months) : t.fee;
  const deposit = Math.round((total * Math.min(100, Math.max(0, t.depositPercent))) / 100);
  if (t.template === "affiliate") {
    add(
      T("Comisión y pago", "Commission and payment"),
      T(
        `La marca pagará a la persona creadora una comisión del ${t.commissionPercent}% sobre las ventas netas (sin impuestos, envíos ni devoluciones) hechas con su enlace o código.`,
        `The brand will pay the creator a ${t.commissionPercent}% commission on net sales (excluding taxes, shipping and returns) made with their link or code.`
      ),
      T(
        `La marca compartirá un reporte de ventas cada mes y pagará las comisiones dentro de ${days(t.paymentDays)} después de recibir la factura.`,
        `The brand will share a sales report each month and pay commissions within ${days(t.paymentDays)} after receiving the invoice.`
      ),
      t.fee > 0 && T(`Además, la marca pagará un monto fijo de ${money(t.fee)}.`, `In addition, the brand will pay a fixed amount of ${money(t.fee)}.`)
    );
  } else {
    add(
      T("Pago", "Payment"),
      t.template === "ambassador"
        ? T(
            `La marca pagará ${money(t.fee)} por mes durante ${t.months || 1} ${plural(t.months || 1, "mes", "meses")} (total ${money(total)}).`,
            `The brand will pay ${money(t.fee)} per month for ${t.months || 1} ${plural(t.months || 1, "month", "months")} (total ${money(total)}).`
          )
        : T(`La marca pagará un total de ${money(total)}.`, `The brand will pay a total of ${money(total)}.`),
      t.depositPercent > 0 && t.template !== "ambassador"
        ? T(
            `Un anticipo del ${t.depositPercent}% (${money(deposit)}) se paga antes de empezar el trabajo; el saldo (${money(total - deposit)}) se paga al entregar.`,
            `A ${t.depositPercent}% deposit (${money(deposit)}) is paid before work begins; the balance (${money(total - deposit)}) is paid on delivery.`
          )
        : t.template === "ambassador"
          ? T("El pago de cada mes se factura al empezar ese mes.", "Each month's payment is invoiced at the start of that month.")
          : T("El pago se factura al entregar.", "Payment is invoiced on delivery."),
      T(`Las facturas se pagan dentro de ${days(t.paymentDays)} después de recibirlas.`, `Invoices are paid within ${days(t.paymentDays)} after they are received.`)
    );
  }

  // 6. Derechos de uso
  const usageHeading = T("Derechos de uso del contenido", "Content usage rights");
  if (t.template === "affiliate") {
    add(
      usageHeading,
      T(
        "El contenido es de la persona creadora. La marca puede compartir (repostear) las publicaciones tal como se publicaron. Cualquier otro uso, como anuncios, se acuerda por escrito.",
        "The content belongs to the creator. The brand may share (repost) the posts as published. Any other use, such as ads, is agreed in writing."
      )
    );
  } else if (rights > 0) {
    add(
      usageHeading,
      T(
        `La persona creadora conserva la autoría del contenido y le da a la marca una licencia para usarlo en sus canales (redes, sitio web y correos)${
          t.template === "ugc" || t.whitelisting ? " y en anuncios pagados" : ""
        } durante ${days(rights)} desde la entrega o publicación. Al terminar ese periodo la marca deja de usarlo y puede renovar la licencia por un nuevo pago acordado.`,
        `The creator keeps authorship of the content and grants the brand a license to use it on its channels (social media, website and email)${
          t.template === "ugc" || t.whitelisting ? " and in paid ads" : ""
        } for ${days(rights)} from delivery or publication. After that period the brand stops using it and may renew the license for a newly agreed fee.`
      ),
      T("No se permite editar el contenido de forma que cambie su sentido, ni usarlo para otros productos o marcas.", "The content may not be edited in a way that changes its meaning, nor used for other products or brands.")
    );
  } else {
    add(
      usageHeading,
      T(
        "El contenido es de la persona creadora. La marca puede compartir (repostear) las publicaciones tal como se publicaron, sin editarlas. El uso en anuncios o en otros canales no está incluido y se acuerda por escrito, con un pago aparte.",
        "The content belongs to the creator. The brand may share (repost) the posts as published, unedited. Use in ads or on other channels is not included and is agreed in writing, for a separate fee."
      )
    );
  }

  // 7. Whitelisting
  if (t.whitelisting && t.template !== "ugc") {
    add(
      T("Anuncios desde la cuenta de la persona creadora (whitelisting)", "Ads from the creator's account (whitelisting)"),
      T(
        `La marca podrá pautar anuncios desde la cuenta de la persona creadora (por ejemplo Spark Ads o anuncios de colaboración)${
          rights > 0 ? ` durante el periodo de derechos de uso (${days(rights)})` : " durante el periodo que se acuerde por escrito"
        }. La persona creadora dará el acceso necesario y podrá retirarlo al terminar ese periodo. La marca no publicará nada en nombre de la persona creadora fuera de lo aprobado.`,
        `The brand may run ads from the creator's account (for example Spark Ads or partnership ads)${
          rights > 0 ? ` during the usage rights period (${days(rights)})` : " during the period agreed in writing"
        }. The creator will grant the necessary access and may remove it when that period ends. The brand will not post anything on the creator's behalf beyond what was approved.`
      )
    );
  }

  // 8. Exclusividad
  if (t.exclusivityDays > 0) {
    add(
      T("Exclusividad", "Exclusivity"),
      T(
        `Durante ${days(t.exclusivityDays)} desde la publicación, la persona creadora no publicará contenido patrocinado de marcas competidoras${
          t.exclusivityCategory.trim() ? ` en la categoría «${t.exclusivityCategory.trim()}»` : ""
        }.`,
        `For ${days(t.exclusivityDays)} from publication, the creator will not publish sponsored content for competing brands${
          t.exclusivityCategory.trim() ? ` in the “${t.exclusivityCategory.trim()}” category` : ""
        }.`
      )
    );
  }

  // 9. Divulgación
  add(
    T("Divulgación de la colaboración", "Disclosure of the partnership"),
    posts
      ? T(
          "La persona creadora indicará de forma clara que el contenido es una colaboración pagada (por ejemplo con #publicidad, #ad o la herramienta de colaboración de pago de la plataforma), según las guías de la FTC y las reglas de cada plataforma. La marca no pedirá que se omita esa indicación.",
          "The creator will clearly state that the content is a paid partnership (for example with #ad, #sponsored or the platform's paid partnership tool), following FTC guidelines and each platform's rules. The brand will not ask for that disclosure to be left out."
        )
      : T(
          "Cuando la marca publique este contenido como anuncio o colaboración, será responsable de incluir las divulgaciones que exijan la ley y las plataformas.",
          "When the brand publishes this content as an ad or partnership, it is responsible for including the disclosures required by law and the platforms."
        ),
    T(
      "La marca entregará información veraz sobre el producto. La persona creadora solo dirá lo que sea cierto y no tiene que hacer afirmaciones que no pueda respaldar.",
      "The brand will provide truthful information about the product. The creator will only say what is true and does not have to make claims they cannot support."
    )
  );

  // 10. Cancelación
  add(
    T("Cancelación", "Cancellation"),
    T(
      `Cualquiera de las partes puede cancelar con ${days(t.cancelNoticeDays)} de aviso por escrito. Se paga el trabajo ya realizado.`,
      `Either party may cancel with ${days(t.cancelNoticeDays)} written notice. Work already done is paid for.`
    ),
    t.killFeePercent > 0 && total > 0
      ? T(
          `Si la marca cancela después de que la persona creadora reservó su calendario, pagará el ${t.killFeePercent}% del monto total (${money(Math.round((total * t.killFeePercent) / 100))}) como cargo por cancelación, y el anticipo no se devuelve.`,
          `If the brand cancels after the creator has reserved their calendar, it will pay ${t.killFeePercent}% of the total amount (${money(Math.round((total * t.killFeePercent) / 100))}) as a cancellation fee, and the deposit is non-refundable.`
        )
      : t.depositPercent > 0 && t.template !== "affiliate"
        ? T("Si la marca cancela, el anticipo no se devuelve.", "If the brand cancels, the deposit is non-refundable.")
        : undefined
  );

  // 11. Condiciones adicionales
  if (t.extra.trim()) add(T("Condiciones adicionales", "Additional terms"), ...t.extra.trim().split(/\n+/));

  // 12. Aceptación
  add(
    T("Aceptación", "Acceptance"),
    T(
      "La marca acepta estos términos escribiendo su nombre y confirmando en línea. Las partes acuerdan que el nombre, correo, fecha, hora y dirección IP registrados al aceptar sirven como constancia de la aceptación. Este acuerdo no se puede cambiar después de aceptado; cualquier cambio se hará por escrito y con la aceptación de ambas partes.",
      "The brand accepts these terms by typing its name and confirming online. The parties agree that the name, email, date, time and IP address recorded at acceptance serve as proof of acceptance. This agreement cannot be changed after it is accepted; any change will be made in writing and accepted by both parties."
    )
  );

  return { title, sections };
}

/** Texto plano guardado: "## Título", párrafos y "- " para listas. */
export function contractToText(c: GeneratedContract) {
  return [`# ${c.title}`, ...c.sections.map((s) => [`## ${s.heading}`, ...s.paragraphs].join("\n"))].join("\n\n");
}

/** Lee el texto guardado para mostrarlo. */
export function parseContractText(text: string): GeneratedContract {
  const blocks = text.split(/\n\n+/);
  const title = (blocks.shift() ?? "").replace(/^#\s*/, "");
  const sections = blocks.map((block) => {
    const [first, ...rest] = block.split("\n");
    return { heading: first.replace(/^##\s*/, ""), paragraphs: rest.filter(Boolean) };
  });
  return { title, sections };
}

/** Días que faltan hasta la fecha de entrega (para el panel). */
export function daysToDelivery(deliveryDate: string, now: Date = new Date()) {
  return deliveryDate ? calendarDays(now, new Date(`${deliveryDate}T12:00:00.000Z`)) : null;
}
