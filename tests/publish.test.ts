import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canAutoPublish, isDue, overallStatus, parseResults, planPublish, type PostForPublish } from "../lib/publish";

const post = (over: Partial<PostForPublish> = {}): PostForPublish => ({ networks: ["instagram"], contentType: "reel", mediaType: "video", mediaUrl: "https://blob.example/v.mp4", caption: "Mi rutina", brandId: null, ...over });

describe("qué se puede publicar", () => {
  it("reel de video en Instagram", () => assert.deepEqual(planPublish(post(), "instagram"), { ok: true, kind: "video" }));
  it("foto en Instagram y en Facebook", () => {
    assert.deepEqual(planPublish(post({ contentType: "post", mediaType: "image" }), "instagram"), { ok: true, kind: "image" });
    assert.deepEqual(planPublish(post({ contentType: "post", mediaType: "image" }), "facebook"), { ok: true, kind: "image" });
  });
  it("Facebook acepta solo texto, Instagram no", () => {
    const text = post({ contentType: "post", mediaType: null, mediaUrl: null });
    assert.deepEqual(planPublish(text, "facebook"), { ok: true, kind: "text" });
    assert.deepEqual(planPublish(text, "instagram"), { ok: false, reason: "no_media" });
  });
  it("historias en Instagram", () => assert.deepEqual(planPublish(post({ contentType: "story", mediaType: "image" }), "instagram"), { ok: true, kind: "story_image" }));
  it("rechaza lo que no corresponde", () => {
    assert.deepEqual(planPublish(post({ mediaType: "image" }), "instagram"), { ok: false, reason: "mismatch" });
    assert.deepEqual(planPublish(post({ contentType: "carousel" }), "instagram"), { ok: false, reason: "type" });
    assert.deepEqual(planPublish(post({ contentType: "long_video" }), "instagram"), { ok: false, reason: "type" });
    assert.deepEqual(planPublish(post(), "tiktok"), { ok: false, reason: "network" });
    assert.deepEqual(planPublish(post(), "youtube"), { ok: false, reason: "network" });
    assert.deepEqual(planPublish(post({ mediaUrl: "http://x/v.mp4" }), "instagram"), { ok: false, reason: "bad_media" });
    assert.deepEqual(planPublish(post({ caption: "a".repeat(2201) }), "instagram"), { ok: false, reason: "caption" });
  });
  it("no publica sola una pieza de marca sin aviso de publicidad", () => {
    assert.deepEqual(planPublish(post({ brandId: "b1", caption: "Me encantó este sérum" }), "instagram"), { ok: false, reason: "disclosure" });
    assert.equal(planPublish(post({ brandId: "b1", caption: "#publicidad Me encantó este sérum" }), "instagram").ok, true);
  });
  it("la publicación automática exige que todas las redes se publiquen solas", () => {
    assert.equal(canAutoPublish(["instagram", "facebook"]), true);
    assert.equal(canAutoPublish(["instagram", "tiktok"]), false);
    assert.equal(canAutoPublish([]), false);
  });
});

describe("cuándo le toca", () => {
  const now = new Date("2026-10-10T12:00:00Z");
  const due = { status: "scheduled", autoPublish: true, scheduledFor: new Date("2026-10-10T11:00:00Z"), publishAttempts: 0, publishAttemptedAt: null };
  it("sí cuando ya llegó la hora", () => assert.equal(isDue(due, now), true));
  it("no si es futura, borrador, publicada o sin publicación automática", () => {
    assert.equal(isDue({ ...due, scheduledFor: new Date("2026-10-10T13:00:00Z") }, now), false);
    assert.equal(isDue({ ...due, status: "draft" }, now), false);
    assert.equal(isDue({ ...due, status: "published" }, now), false);
    assert.equal(isDue({ ...due, autoPublish: false }, now), false);
  });
  it("no tras 3 intentos ni con un intento en curso (hace menos de 2 min)", () => {
    assert.equal(isDue({ ...due, publishAttempts: 3 }, now), false);
    assert.equal(isDue({ ...due, publishAttemptedAt: new Date("2026-10-10T11:59:00Z") }, now), false);
    assert.equal(isDue({ ...due, publishAttemptedAt: new Date("2026-10-10T11:50:00Z") }, now), true);
  });
});

describe("resultado general", () => {
  const at = "2026-10-10T12:00:00Z";
  it("publicada solo si todas las redes quedaron ok", () => {
    assert.equal(overallStatus(["instagram", "facebook"], { instagram: { status: "ok", at }, facebook: { status: "ok", at } }), "published");
    assert.equal(overallStatus(["instagram", "facebook"], { instagram: { status: "ok", at }, facebook: { status: "error", at } }), "partial");
    assert.equal(overallStatus(["instagram"], { instagram: { status: "pending", at } }), "pending");
    assert.equal(overallStatus(["instagram"], { instagram: { status: "error", at } }), "failed");
    assert.equal(overallStatus(["instagram"], {}), "none");
    assert.equal(overallStatus(["tiktok"], {}), "none");
  });
  it("lee lo guardado e ignora basura", () => {
    assert.deepEqual(parseResults({ instagram: { status: "ok", at: "x" }, tiktok: { status: "ok" }, facebook: { status: "raro" } }), { instagram: { status: "ok", at: "x" } });
    assert.deepEqual(parseResults(null), {});
  });
});
