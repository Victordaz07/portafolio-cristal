import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AMBASSADOR, codeFromBytes, effectivePlanId, normalizeReferralCode, referralLink, rewardDecision, rewardDue } from "../lib/ambassadors";
import { billingState } from "../lib/billing";
import { checkDisclosure } from "../lib/disclosure";
import { kitTexts, programRules } from "../lib/ambassador-kit";
import { aiMonthlyLimit } from "../lib/ai";

describe("código de embajadora", () => {
  it("siempre tiene 8 caracteres sin letras confusas", () => {
    const code = codeFromBytes([0, 1, 2, 3, 250, 251, 252, 253]);
    assert.equal(code.length, 8);
    assert.doesNotMatch(code, /[01OIL]/);
  });
  it("se normaliza (mayúsculas, sin espacios ni guiones)", () => {
    const code = codeFromBytes([5, 6, 7, 8, 9, 10, 11, 12]);
    assert.equal(normalizeReferralCode(` ${code.slice(0, 4).toLowerCase()}-${code.slice(4)} `), code);
  });
  it("rechaza lo que no puede ser un código", () => {
    assert.equal(normalizeReferralCode(null), null);
    assert.equal(normalizeReferralCode("ABC"), null);
    assert.equal(normalizeReferralCode("0OIL1111"), null);
    assert.equal(normalizeReferralCode("ABCD'; --"), null);
  });
  it("arma el enlace", () => {
    assert.equal(referralLink("https://foliocrew.pro/", "ABCD2345"), "https://foliocrew.pro/?ref=ABCD2345");
  });
});

describe("plan de la embajadora", () => {
  it("tiene como mínimo Folio Pro, pero no baja a Crew", () => {
    assert.equal(effectivePlanId("folio", true), "pro");
    assert.equal(effectivePlanId("pro", true), "pro");
    assert.equal(effectivePlanId("crew", true), "crew");
    assert.equal(effectivePlanId("folio", false), "folio");
  });
  it("sus límites de IA son los de Folio Pro", () => {
    assert.equal(aiMonthlyLimit("folio", false, true), aiMonthlyLimit("pro"));
    assert.ok(aiMonthlyLimit("folio") < aiMonthlyLimit("pro"));
  });
  it("el estado del plan es «Embajadora»: no vence", () => {
    const expired = { plan: "folio", comp: false, trialEndsAt: new Date("2020-01-01"), paidUntil: new Date("2020-02-01") };
    assert.equal(billingState(expired).state, "expired");
    const now = billingState({ ...expired, ambassador: true });
    assert.equal(now.state, "ambassador");
    assert.equal(now.until, null);
  });
  it("la cuenta de cortesía sigue ganando sobre embajadora", () => {
    assert.equal(billingState({ plan: "pro", comp: true, ambassador: true, trialEndsAt: null, paidUntil: null }).state, "comp");
  });
});

describe("recompensa", () => {
  const paid = new Date("2026-01-01T00:00:00Z");
  it("no se da antes de la espera", () => {
    assert.equal(rewardDue(paid, new Date(paid.getTime() + (AMBASSADOR.waitDays - 1) * 86_400_000)), false);
    assert.equal(rewardDue(null), false);
  });
  it("se da cuando se cumple la espera", () => {
    assert.equal(rewardDue(paid, new Date(paid.getTime() + AMBASSADOR.waitDays * 86_400_000)), true);
  });
});

describe("kit de la embajadora", () => {
  const link = "https://foliocrew.pro/?ref=ABCD2345";
  for (const lang of ["es", "en"] as const) {
    it(`(${lang}) todos los textos dicen que es publicidad desde el inicio y llevan el enlace`, () => {
      for (const item of kitTexts(link, lang)) {
        if (item.id === "dm") continue; // el mensaje directo no es una publicación: avisa con palabras, al inicio
        const check = checkDisclosure(item.text, ["instagram", "tiktok"]);
        assert.equal(check.status, "ok", `${lang}/${item.id}: ${check.status}`);
        assert.ok(item.text.includes(link));
      }
      const dm = kitTexts(link, lang).find((x) => x.id === "dm")!;
      assert.ok(dm.text.includes(link));
      assert.match(dm.text, lang === "es" ? /soy embajadora de Foliocrew/ : /I'm a Foliocrew ambassador/);
    });
    it(`(${lang}) las reglas mencionan los parámetros reales`, () => {
      const text = programRules(lang).join(" ");
      assert.ok(text.includes(String(AMBASSADOR.waitDays)) && text.includes(String(AMBASSADOR.cookieDays)));
    });
  }
});

describe("decisión de la recompensa", () => {
  const paidAt = new Date("2026-01-01T00:00:00Z");
  const day = (n: number) => new Date(paidAt.getTime() + n * 86_400_000);
  const ok = { paidAt, now: day(AMBASSADOR.waitDays), referredActive: true, referredPaying: true, referrerAmbassador: true, referrerActive: true };
  it("premia cuando se cumple la espera y todo sigue en orden", () => {
    assert.equal(rewardDecision(ok), "reward");
  });
  it("espera antes de los 30 días", () => {
    assert.equal(rewardDecision({ ...ok, now: day(AMBASSADOR.waitDays - 1) }), "wait");
    assert.equal(rewardDecision({ ...ok, paidAt: null }), "wait");
  });
  it("si la cuenta referida se pausó o ya no paga, no hay recompensa (churned)", () => {
    assert.equal(rewardDecision({ ...ok, referredActive: false }), "churned");
    assert.equal(rewardDecision({ ...ok, referredPaying: false }), "churned");
  });
  it("si quien invitó ya no es embajadora (o está pausada) queda pendiente (hold), no se pierde", () => {
    assert.equal(rewardDecision({ ...ok, referrerAmbassador: false }), "hold");
    assert.equal(rewardDecision({ ...ok, referrerActive: false }), "hold");
  });
  it("churned gana sobre hold: una cuenta que se fue nunca premia", () => {
    assert.equal(rewardDecision({ ...ok, referredPaying: false, referrerAmbassador: false }), "churned");
  });
});
