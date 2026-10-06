import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canEditWithin,
  connectionState,
  isUnread,
  pairOf,
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

test("enlaces dentro del texto, sin incluir la puntuación final", async () => {
  const { splitLinks, timeAgo } = await import("../lib/community");
  const parts = splitLinks("Mira https://foliocrew.pro/precios. ¡Gracias!");
  assert.deepEqual(parts, [{ text: "Mira " }, { text: "https://foliocrew.pro/precios", href: "https://foliocrew.pro/precios" }, { text: ". ¡Gracias!" }]);
  assert.deepEqual(splitLinks("sin enlaces"), [{ text: "sin enlaces" }]);
  assert.deepEqual(splitLinks("javascript:alert(1)"), [{ text: "javascript:alert(1)" }]);
  const now = new Date("2026-10-06T12:00:00Z");
  assert.equal(timeAgo(new Date(now.getTime() - 5 * 60_000), "es", now), "hace 5 min");
  assert.equal(timeAgo(new Date(now.getTime() - 3 * 3_600_000), "en", now), "3h ago");
});

test("estado de la conexión según quién mira", () => {
  const pending = { requesterId: "a", addresseeId: "b", status: "pending" };
  assert.equal(connectionState(null, "a"), "none");
  assert.equal(connectionState(pending, "a"), "outgoing");
  assert.equal(connectionState(pending, "b"), "incoming");
  const declined = { ...pending, status: "declined" };
  assert.equal(connectionState(declined, "a"), "outgoing");
  assert.equal(connectionState(declined, "b"), "none");
  const accepted = { ...pending, status: "accepted" };
  assert.equal(connectionState(accepted, "a"), "connected");
  assert.equal(connectionState(accepted, "b"), "connected");
});

test("mensajes: par ordenado y no leídos", () => {
  assert.deepEqual(pairOf("b", "a"), { aId: "a", bId: "b" });
  assert.deepEqual(pairOf("a", "b"), { aId: "a", bId: "b" });
  const t1 = new Date("2026-10-06T10:00:00Z");
  const t2 = new Date("2026-10-06T11:00:00Z");
  const c = { aId: "a", aReadAt: t1, bReadAt: null, lastMessageAt: t2, lastSenderId: "b" };
  assert.equal(isUnread(c, "a"), true);
  assert.equal(isUnread(c, "b"), false, "lo que envié no cuenta como no leído");
  assert.equal(isUnread({ ...c, aReadAt: t2 }, "a"), false);
  assert.equal(isUnread({ ...c, lastSenderId: null }, "a"), false);
});
