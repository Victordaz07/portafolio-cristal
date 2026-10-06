import { test } from "node:test";
import assert from "node:assert/strict";
import { contractToText, emptyTerms, generateContract, parseContractText, type ContractParties } from "../lib/contracts";

const parties: ContractParties = {
  creator: { name: "Cristal Flores", location: "Miami, FL", email: "c@x.test" },
  brand: { company: "Glow Co", name: "Ana", email: "ana@glow.test" },
};
const text = (c: ReturnType<typeof generateContract>) => contractToText(c);

test("publicación patrocinada: pago, anticipo, revisiones y divulgación", () => {
  const t = { ...emptyTerms("sponsored"), fee: 100_000, depositPercent: 50, deliverables: ["2 reels", "3 historias"], deliveryDate: "2026-11-15", usageDays: 30 };
  const body = text(generateContract(t, parties, "es"));
  assert.match(body, /Cristal Flores \(Miami, FL\)/);
  assert.match(body, /Glow Co, representada por Ana/);
  assert.match(body, /- 2 reels\n- 3 historias/);
  assert.match(body, /15 de noviembre de 2026/);
  assert.match(body, /total de \$1,000/);
  assert.match(body, /anticipo del 50% \(\$500\)[^\n]*saldo \(\$500\)/);
  assert.match(body, /2 rondas de cambios/);
  assert.match(body, /#publicidad/);
  assert.match(body, /durante 30 días/);
  assert.doesNotMatch(body, /Exclusividad/);
  assert.doesNotMatch(body, /whitelisting/);
});

test("solo incluye las cláusulas que aplican", () => {
  const base = { ...emptyTerms("sponsored"), fee: 50_000 };
  const h = (t: typeof base) => generateContract(t, parties, "es").sections.map((s) => s.heading.replace(/^\d+\.\s*/, ""));
  assert.ok(!h(base).includes("Exclusividad"));
  assert.ok(h({ ...base, exclusivityDays: 60, exclusivityCategory: "skincare" }).includes("Exclusividad"));
  assert.match(text(generateContract({ ...base, exclusivityDays: 60, exclusivityCategory: "skincare" }, parties, "es")), /60 días[^\n]*categoría «skincare»/);
  assert.ok(h({ ...base, whitelisting: true, usageDays: 30 }).some((x) => x.startsWith("Anuncios")));
  assert.ok(!h({ ...base, extra: "" }).includes("Condiciones adicionales"));
  assert.ok(h({ ...base, extra: "Ley de Florida." }).includes("Condiciones adicionales"));
});

test("sin derechos de uso: solo repostear, sin licencia para anuncios", () => {
  const body = text(generateContract({ ...emptyTerms("sponsored"), fee: 10_000 }, parties, "es"));
  assert.match(body, /repostear/);
  assert.match(body, /no está incluido/);
});

test("UGC: licencia para anuncios y divulgación a cargo de la marca", () => {
  const body = text(generateContract({ ...emptyTerms("ugc"), fee: 30_000 }, parties, "es"));
  assert.match(body, /no se publica en las cuentas/);
  assert.match(body, /anuncios pagados[^\n]*90 días/);
  assert.match(body, /será responsable de incluir las divulgaciones/);
});

test("embajador: total = mensualidad × meses; afiliado: comisión", () => {
  const amb = text(generateContract({ ...emptyTerms("ambassador"), fee: 40_000, months: 3 }, parties, "es"));
  assert.match(amb, /\$400 por mes durante 3 meses \(total \$1,200\)/);
  const aff = text(generateContract({ ...emptyTerms("affiliate"), commissionPercent: 12 }, parties, "es"));
  assert.match(aff, /comisión del 12%/);
  assert.doesNotMatch(aff, /Revisiones/);
});

test("cancelación: cargo por cancelación y aviso", () => {
  const body = text(generateContract({ ...emptyTerms("sponsored"), fee: 100_000, killFeePercent: 25, cancelNoticeDays: 7 }, parties, "es"));
  assert.match(body, /7 días de aviso/);
  assert.match(body, /25% del monto total \(\$250\)/);
  const noFee = text(generateContract({ ...emptyTerms("sponsored"), fee: 100_000, killFeePercent: 0 }, parties, "es"));
  assert.match(noFee, /el anticipo no se devuelve/);
});

test("versión en inglés", () => {
  const body = text(generateContract({ ...emptyTerms("sponsored"), fee: 100_000, usageDays: 30, whitelisting: true }, parties, "en"));
  assert.match(body, /Sponsored post agreement/);
  assert.match(body, /paid partnership/);
  assert.match(body, /Spark Ads/);
  assert.match(body, /a total of \$1,000/);
  assert.doesNotMatch(body, /creadora/);
});

test("el texto guardado se puede leer de nuevo", () => {
  const original = generateContract({ ...emptyTerms("sponsored"), fee: 20_000, deliverables: ["Un reel"] }, parties, "es");
  const back = parseContractText(contractToText(original));
  assert.equal(back.title, original.title);
  assert.deepEqual(back.sections, original.sections);
});

test("la numeración de las cláusulas no tiene saltos", () => {
  const nums = (t: Parameters<typeof generateContract>[0]) => generateContract(t, parties, "es").sections.map((x) => Number(x.heading.match(/^(\d+)\./)?.[1]));
  const check = (list: number[]) => assert.deepEqual(list, list.map((_, i) => i + 1));
  check(nums({ ...emptyTerms("sponsored"), fee: 1000 }));
  check(nums({ ...emptyTerms("sponsored"), fee: 1000, whitelisting: true, usageDays: 30, exclusivityDays: 30, extra: "x" }));
  check(nums({ ...emptyTerms("affiliate"), commissionPercent: 10 }));
});
