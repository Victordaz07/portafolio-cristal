import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FOLLOW_UP_DAYS, followUpDate, isUnanswered, mailtoLink, pitchState } from "../lib/pitch";

const sent = new Date("2026-03-01T10:00:00Z");
const at = (days: number) => new Date(sent.getTime() + days * 86_400_000);
const base = { dealStatus: "prospect", pitchSentAt: sent, pitchFollowUps: 0, pitchRepliedAt: null };

describe("estado de la propuesta", () => {
  it("sin propuesta enviada no hay nada que seguir", () => {
    assert.equal(pitchState({ ...base, pitchSentAt: null }, at(30)).phase, "none");
    assert.equal(isUnanswered({ ...base, pitchSentAt: null }, at(30)), false);
  });
  it("espera hasta el día 5 y entonces toca el seguimiento 1", () => {
    assert.equal(pitchState(base, at(4)).phase, "waiting");
    const s = pitchState(base, at(FOLLOW_UP_DAYS[0]));
    assert.equal(s.phase, "followup-due");
    assert.equal(s.followUpNumber, 1);
  });
  it("después del seguimiento 1 espera hasta el día 12 y toca el 2", () => {
    const one = { ...base, pitchFollowUps: 1 };
    assert.equal(pitchState(one, at(11)).phase, "waiting");
    const s = pitchState(one, at(FOLLOW_UP_DAYS[1]));
    assert.equal(s.phase, "followup-due");
    assert.equal(s.followUpNumber, 2);
  });
  it("con los dos seguimientos enviados ya no hay más (exhausted) y sigue sin respuesta", () => {
    const two = { ...base, pitchFollowUps: 2 };
    assert.equal(pitchState(two, at(40)).phase, "exhausted");
    assert.equal(pitchState(two, at(40)).nextFollowUpAt, null);
    assert.equal(isUnanswered(two, at(40)), true);
  });
  it("si la marca respondió deja de contar como sin respuesta", () => {
    const replied = { ...base, pitchRepliedAt: at(3) };
    assert.equal(pitchState(replied, at(20)).phase, "replied");
    assert.equal(isUnanswered(replied, at(20)), false);
  });
  it("si el trato avanzó (ya no es prospecto) no cuenta como sin respuesta", () => {
    assert.equal(isUnanswered({ ...base, dealStatus: "negotiating" }, at(8)), false);
  });
  it("acepta fechas en texto (vienen del navegador como JSON)", () => {
    assert.equal(pitchState({ ...base, pitchSentAt: sent.toISOString() }, at(6)).phase, "followup-due");
  });
});

describe("ayudas", () => {
  it("arma el enlace mailto con asunto y cuerpo codificados", () => {
    const link = mailtoLink("hola@marca.com", "Colaboración & más", "Línea 1\nLínea 2");
    assert.ok(link.startsWith("mailto:hola%40marca.com?subject="));
    assert.ok(link.includes("Colaboraci%C3%B3n%20%26%20m%C3%A1s"));
    assert.ok(link.includes("%0A"));
  });
  it("funciona sin correo de contacto y recorta cuerpos enormes", () => {
    assert.ok(mailtoLink(null, "x", "a".repeat(5000)).length < 1700);
    assert.ok(mailtoLink(undefined, "x", "y").startsWith("mailto:?subject="));
  });
  it("la fecha del seguimiento es de calendario (mediodía UTC) y suma los días", () => {
    const d = followUpDate(new Date("2026-03-01T23:30:00Z"), 5);
    assert.equal(d.toISOString(), "2026-03-06T12:00:00.000Z");
  });
});
