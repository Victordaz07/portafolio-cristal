import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canAccess, hasCrewAccess, icsFor, rsvpDecision, sessionPhase, slugify, validateCircle, validateSession } from "../lib/circles";

describe("beneficio Crew", () => {
  it("solo Crew (o cortesía) entra a lo exclusivo", () => {
    assert.equal(hasCrewAccess({ plan: "crew", comp: false }), true);
    assert.equal(hasCrewAccess({ plan: "folio", comp: true }), true);
    assert.equal(hasCrewAccess({ plan: "pro", comp: false }), false);
    assert.equal(canAccess(false, { plan: "folio", comp: false }), true);
    assert.equal(canAccess(true, { plan: "pro", comp: false }), false);
  });
});

describe("círculos", () => {
  it("arma el slug sin acentos ni signos", () => assert.equal(slugify("  Cocina saludable & fit 🍎 "), "cocina-saludable-fit"));
  it("valida", () => {
    assert.deepEqual(validateCircle({ name: "Mamás creadoras", kind: "niche" }), { ok: true, slug: "mamas-creadoras" });
    assert.deepEqual(validateCircle({ name: "  ", kind: "niche" }), { ok: false, reason: "name" });
    assert.deepEqual(validateCircle({ name: "🍎", kind: "niche" }), { ok: false, reason: "name" });
    assert.deepEqual(validateCircle({ name: "Algo", kind: "raro" }), { ok: false, reason: "kind" });
    assert.deepEqual(validateCircle({ name: "Algo", kind: "level", description: "x".repeat(501) }), { ok: false, reason: "description" });
  });
});

describe("sesiones", () => {
  const now = new Date("2026-10-10T12:00:00Z");
  const base = { kind: "live", title: "Cómo cerrar tu primera marca", hostName: "Ana Gómez", startsAt: new Date("2026-10-20T18:00:00Z"), durationMin: 60, joinUrl: "https://meet.example.com/abc", capacity: 50 };
  it("acepta una sesión bien armada", () => assert.deepEqual(validateSession(base, now), { ok: true }));
  it("rechaza lo inválido", () => {
    assert.deepEqual(validateSession({ ...base, kind: "x" }, now), { ok: false, reason: "kind" });
    assert.deepEqual(validateSession({ ...base, startsAt: new Date("2026-09-01T00:00:00Z") }, now), { ok: false, reason: "date" });
    assert.deepEqual(validateSession({ ...base, durationMin: 5 }, now), { ok: false, reason: "duration" });
    assert.deepEqual(validateSession({ ...base, joinUrl: "http://x.com" }, now), { ok: false, reason: "url" });
    assert.deepEqual(validateSession({ ...base, capacity: 0 }, now), { ok: false, reason: "capacity" });
    assert.deepEqual(validateSession({ ...base, hostName: "" }, now), { ok: false, reason: "host" });
  });
  it("fase: próxima, en vivo (desde 15 min antes), terminada o cancelada", () => {
    const s = { startsAt: new Date("2026-10-10T18:00:00Z"), durationMin: 60, canceledAt: null };
    assert.equal(sessionPhase(s, new Date("2026-10-10T12:00:00Z")), "upcoming");
    assert.equal(sessionPhase(s, new Date("2026-10-10T17:50:00Z")), "live");
    assert.equal(sessionPhase(s, new Date("2026-10-10T18:30:00Z")), "live");
    assert.equal(sessionPhase(s, new Date("2026-10-10T19:00:00Z")), "ended");
    assert.equal(sessionPhase({ ...s, canceledAt: new Date() }, now), "canceled");
  });
  it("reserva: cupo, repetidos, Crew y estado", () => {
    const account = { plan: "pro", comp: false };
    const base2 = { phase: "upcoming" as const, crewOnly: false, account, taken: 0, capacity: 2 as number | null, already: false };
    assert.equal(rsvpDecision(base2), "ok");
    assert.equal(rsvpDecision({ ...base2, already: true }), "already");
    assert.equal(rsvpDecision({ ...base2, taken: 2 }), "full");
    assert.equal(rsvpDecision({ ...base2, capacity: null, taken: 999 }), "ok");
    assert.equal(rsvpDecision({ ...base2, crewOnly: true }), "crew");
    assert.equal(rsvpDecision({ ...base2, crewOnly: true, account: { plan: "crew", comp: false } }), "ok");
    assert.equal(rsvpDecision({ ...base2, phase: "ended" }), "ended");
    assert.equal(rsvpDecision({ ...base2, phase: "canceled" }), "canceled");
  });
  it("el archivo de calendario escapa el texto y lleva el enlace", () => {
    const text = icsFor({ id: "s1", title: "Hola, mundo; adiós", description: "Línea 1\nLínea 2", startsAt: new Date("2026-10-20T18:00:00Z"), durationMin: 90, joinUrl: "https://meet.example.com/abc" });
    assert.match(text, /DTSTART:20261020T180000Z/);
    assert.match(text, /DTEND:20261020T193000Z/);
    assert.match(text, /SUMMARY:Hola\\, mundo\; adiós/);
    assert.match(text, /Línea 1\\nLínea 2/);
    assert.match(text, /URL:https:\/\/meet.example.com\/abc/);
    assert.ok(text.endsWith("\r\n"));
  });
});
