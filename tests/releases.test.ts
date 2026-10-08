import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  NEW_BADGE_DAYS,
  RELEASE_MODULES,
  RELEASE_SEASONS,
  canSee,
  isNewRelease,
  levelCounts,
  moduleForHref,
  navEntry,
  nextPublicAt,
  resolveReleases,
} from "../lib/releases";

const DAY = 86_400_000;
const member = { ambassador: false, platformAdmin: false };
const ambassador = { ambassador: true, platformAdmin: false };
const admin = { ambassador: false, platformAdmin: true };

describe("catálogo de módulos", () => {
  it("cada módulo tiene un id único y una temporada que existe", () => {
    const ids = RELEASE_MODULES.map((m) => m.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const m of RELEASE_MODULES) assert.ok(RELEASE_SEASONS.some((s) => s.id === m.season), m.id);
  });
  it("una página del panel pertenece a un solo módulo", () => {
    const hrefs = RELEASE_MODULES.flatMap((m) => m.hrefs);
    assert.equal(new Set(hrefs).size, hrefs.length);
  });
  it("las posiciones iniciales son las de la vista previa", () => {
    const map = resolveReleases([]);
    assert.ok(RELEASE_MODULES.filter((m) => m.season === 1).every((m) => map[m.id].level === "all"));
    assert.ok(RELEASE_MODULES.filter((m) => m.season === 2).every((m) => map[m.id].level === "amb"));
    assert.equal(map.muro.level, "amb");
    assert.equal(map.buscar.level, "amb");
    assert.equal(map.circulos.level, "off");
    assert.ok(RELEASE_MODULES.filter((m) => m.season === 4).every((m) => map[m.id].level === "off"));
  });
});

describe("quién ve cada nivel", () => {
  it("apagado: nadie, salvo quien administra", () => {
    assert.equal(canSee("off", member), false);
    assert.equal(canSee("off", ambassador), false);
    assert.equal(canSee("off", admin), true);
  });
  it("embajadores: solo embajadores (y quien administra)", () => {
    assert.equal(canSee("amb", member), false);
    assert.equal(canSee("amb", ambassador), true);
    assert.equal(canSee("amb", admin), true);
  });
  it("todos: todo el mundo; un módulo desconocido no se esconde", () => {
    assert.equal(canSee("all", member), true);
    assert.equal(canSee(undefined, member), true);
  });
});

describe("lo guardado", () => {
  it("gana sobre la posición por defecto, y se ignora un valor raro o un módulo que ya no existe", () => {
    const map = resolveReleases([
      { id: "tienda", level: "all", publicAt: null },
      { id: "feed", level: "raro", publicAt: null },
      { id: "viejo", level: "off", publicAt: null },
    ]);
    assert.equal(map.tienda.level, "all");
    assert.equal(map.feed.level, "all");
    assert.equal(map.viejo, undefined);
  });
  it("cuenta cuántos hay en cada posición", () => {
    const counts = levelCounts(resolveReleases([]));
    assert.equal(counts.off + counts.amb + counts.all, RELEASE_MODULES.length);
  });
});

describe("etiqueta «Nuevo»", () => {
  const now = new Date("2026-10-08T12:00:00Z");
  it("la fecha se marca solo al pasar a «Todos» desde otra posición", () => {
    assert.equal(nextPublicAt({ level: "amb", publicAt: null }, "all", now), now);
    const before = new Date("2026-10-01T00:00:00Z");
    assert.equal(nextPublicAt({ level: "all", publicAt: before }, "all", now), before);
    assert.equal(nextPublicAt({ level: "all", publicAt: before }, "amb", now), null);
  });
  it("dura NEW_BADGE_DAYS días y solo mientras sigue en «Todos»", () => {
    const fresh = new Date(now.getTime() - DAY);
    const old = new Date(now.getTime() - (NEW_BADGE_DAYS + 1) * DAY);
    assert.equal(isNewRelease({ level: "all", publicAt: fresh }, now), true);
    assert.equal(isNewRelease({ level: "all", publicAt: old }, now), false);
    assert.equal(isNewRelease({ level: "amb", publicAt: fresh }, now), false);
    assert.equal(isNewRelease({ level: "all", publicAt: null }, now), false);
  });
});

describe("menú lateral", () => {
  const map = resolveReleases([]);
  it("encuentra el módulo de una página (la ruta más específica gana)", () => {
    assert.equal(moduleForHref("/admin/tienda"), "tienda");
    assert.equal(moduleForHref("/admin/comunidad"), "muro");
    assert.equal(moduleForHref("/admin/comunidad/circulos"), "circulos");
    assert.equal(moduleForHref("/admin/comunidad/creador/ana"), "buscar");
    assert.equal(moduleForHref("/admin/plan"), null);
  });
  it("esconde lo cerrado y etiqueta lo anticipado", () => {
    assert.deepEqual(navEntry("/admin/tienda", map, member), { hidden: true, tag: null });
    assert.deepEqual(navEntry("/admin/tienda", map, ambassador), { hidden: false, tag: "early" });
    assert.deepEqual(navEntry("/admin/comunidad/circulos", map, ambassador), { hidden: true, tag: null });
    assert.deepEqual(navEntry("/admin/comunidad/circulos", map, admin), { hidden: false, tag: "off" });
    assert.deepEqual(navEntry("/admin/feed", map, member), { hidden: false, tag: null });
    assert.deepEqual(navEntry("/admin/plan", map, member), { hidden: false, tag: null });
  });
  it("«Mi perfil» de la comunidad sale si al menos un módulo de la comunidad se ve", () => {
    assert.equal(navEntry("/admin/comunidad/perfil", map, member).hidden, true);
    assert.equal(navEntry("/admin/comunidad/perfil", map, ambassador).hidden, false);
  });
  it("«Nuevo» en el menú cuando acaba de pasar a todos", () => {
    const now = new Date("2026-10-08T12:00:00Z");
    const open = resolveReleases([{ id: "tienda", level: "all", publicAt: new Date(now.getTime() - DAY) }]);
    assert.deepEqual(navEntry("/admin/tienda", open, member, now), { hidden: false, tag: "new" });
  });
});
