import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { fillMessage, isOwnComment, matchesKeyword, normalizeKeyword, parseCommentEvents, validateRule, withinReplyWindow } from "../lib/comment-trigger";
import { verifySignature } from "../lib/comment-trigger-signature";

describe("palabra clave", () => {
  it("se normaliza: sin acentos, mayúsculas ni signos", () => {
    assert.equal(normalizeKeyword("  ¡LÍNK! "), "link");
    assert.equal(normalizeKeyword("Guía"), "guia");
    assert.equal(normalizeKeyword("a".repeat(80)).length, 30);
  });
  it("coincide con la palabra completa, no con trozos", () => {
    assert.equal(matchesKeyword("Quiero el LINK!!", "link"), true);
    assert.equal(matchesKeyword("quiero la guía 😍", "GUIA"), true);
    assert.equal(matchesKeyword("mi linkedin", "link"), false);
    assert.equal(matchesKeyword("hola", ""), false);
  });
});

describe("aviso de Meta", () => {
  const body = {
    object: "instagram",
    entry: [{ id: "111", time: 1790000000, changes: [{ field: "comments", value: { id: "c1", text: "LINK", from: { id: "222", username: "ana" }, media: { id: "m1" } } }, { field: "mentions", value: {} }, { field: "comments", value: { id: "c2" } }] }],
  };
  it("extrae solo los comentarios completos", () => {
    const e = parseCommentEvents(body);
    assert.equal(e.length, 1);
    assert.deepEqual({ a: e[0].accountId, c: e[0].commentId, m: e[0].mediaId, f: e[0].fromId, u: e[0].fromUsername }, { a: "111", c: "c1", m: "m1", f: "222", u: "ana" });
  });
  it("ignora lo que no es de Instagram o viene roto", () => {
    assert.deepEqual(parseCommentEvents({ object: "page", entry: [] }), []);
    assert.deepEqual(parseCommentEvents(null), []);
    assert.deepEqual(parseCommentEvents({ object: "instagram", entry: "x" }), []);
  });
  it("detecta la propia cuenta", () => {
    const [e] = parseCommentEvents(body);
    assert.equal(isOwnComment(e, ["222"]), true);
    assert.equal(isOwnComment(e, ["111", null]), false);
  });
});

describe("firma", () => {
  const raw = '{"a":1}';
  const sig = "sha256=" + createHmac("sha256", "secreto").update(raw).digest("hex");
  it("acepta la firma correcta", () => assert.equal(verifySignature(raw, sig, "secreto"), true));
  it("rechaza firma falsa, vacía, sin secreto o con otro cuerpo", () => {
    assert.equal(verifySignature(raw, sig, "otro"), false);
    assert.equal(verifySignature(raw + " ", sig, "secreto"), false);
    assert.equal(verifySignature(raw, null, "secreto"), false);
    assert.equal(verifySignature(raw, sig, undefined), false);
    assert.equal(verifySignature(raw, "sha256=zz", "secreto"), false);
  });
});

describe("ventana de 7 días y reglas", () => {
  const now = new Date("2026-10-10T00:00:00Z");
  it("responde dentro de 7 días y no después", () => {
    assert.equal(withinReplyWindow(now.getTime() / 1000 - 6 * 86400, now), true);
    assert.equal(withinReplyWindow(now.getTime() / 1000 - 8 * 86400, now), false);
    assert.equal(withinReplyWindow(null, now), true);
  });
  it("valida la regla", () => {
    assert.deepEqual(validateRule({ mediaId: "m", keyword: " LINK ", message: " Hola " }), { ok: true, keyword: "link", message: "Hola" });
    assert.deepEqual(validateRule({ mediaId: "", keyword: "link", message: "x" }), { ok: false, reason: "media" });
    assert.deepEqual(validateRule({ mediaId: "m", keyword: "a", message: "x" }), { ok: false, reason: "keyword" });
    assert.deepEqual(validateRule({ mediaId: "m", keyword: "link", message: "" }), { ok: false, reason: "message" });
    assert.deepEqual(validateRule({ mediaId: "m", keyword: "link", message: "x".repeat(901) }), { ok: false, reason: "message" });
  });
  it("rellena el nombre", () => {
    assert.equal(fillMessage("Hola {nombre}, aquí va", "ana"), "Hola @ana, aquí va");
    assert.equal(fillMessage("Hola {nombre} aquí va", null), "Hola aquí va");
  });
});
