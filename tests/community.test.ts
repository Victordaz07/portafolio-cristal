import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canEditWithin,
  creatorTypeLabel,
  creatorTypesFrom,
  featuredScore,
  isPostKind,
  isTopic,
  levelFor,
  levelLabel,
  nextReputation,
  postKindLabel,
} from "../lib/community";

test("niveles por reputación", () => {
  assert.equal(levelFor(0).id, "nuevo");
  assert.equal(levelFor(19).id, "nuevo");
  assert.equal(levelFor(20).id, "activo");
  assert.equal(levelFor(150).id, "aporta");
  assert.equal(levelFor(300).id, "referente");
  assert.equal(levelLabel(300, "en"), "Leader");
});

test("la reputación nunca baja de 0", () => {
  assert.equal(nextReputation(2, -2), 0);
  assert.equal(nextReputation(0, -2), 0);
  assert.equal(nextReputation(10, 2), 12);
});

test("destacadas: más interacción sube, la antigüedad baja", () => {
  const now = new Date("2026-10-06T12:00:00Z");
  const fresh = { helpfulCount: 3, replyCount: 2, createdAt: now };
  const old = { ...fresh, createdAt: new Date(now.getTime() - 4 * 86_400_000) };
  const busy = { ...fresh, helpfulCount: 10 };
  assert.ok(featuredScore(fresh, now) > featuredScore(old, now));
  assert.ok(featuredScore(busy, now) > featuredScore(fresh, now));
});

test("editar solo los primeros 30 minutos", () => {
  const now = new Date("2026-10-06T12:00:00Z");
  assert.equal(canEditWithin(new Date(now.getTime() - 29 * 60_000), now), true);
  assert.equal(canEditWithin(new Date(now.getTime() - 31 * 60_000), now), false);
});

test("tipos de creador desde las redes conectadas", () => {
  assert.deepEqual(creatorTypesFrom(["instagram", "tiktok", "desconocida"], "contenido"), ["tiktok", "instagram"]);
  assert.deepEqual(creatorTypesFrom([], "ambos"), ["ugc"]);
  assert.deepEqual(creatorTypesFrom(["youtube"], "ugc"), ["youtube", "ugc"]);
});

test("validaciones y etiquetas bilingües", () => {
  assert.equal(isPostKind("pregunta"), true);
  assert.equal(isPostKind("spam"), false);
  assert.equal(isTopic("marcas_y_dinero"), true);
  assert.equal(postKindLabel("logro", "en"), "Win");
  assert.equal(creatorTypeLabel("fotografia"), "Fotografía");
  assert.equal(creatorTypeLabel("x"), "x");
});
