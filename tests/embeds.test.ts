import { test } from "node:test";
import assert from "node:assert/strict";
import { parseEmbedUrl, tiktokCanonicalUrl, tiktokPostId } from "../lib/embeds";

test("detecta la red y el tipo", () => {
  assert.deepEqual(parseEmbedUrl("https://www.tiktok.com/@foliocrew/video/123"), { platform: "tiktok", inferredType: "video" });
  assert.deepEqual(parseEmbedUrl("https://www.tiktok.com/@foliocrew/photo/123"), { platform: "tiktok", inferredType: "photo" });
  assert.deepEqual(parseEmbedUrl("https://www.instagram.com/reel/abc/"), { platform: "instagram", inferredType: "video" });
  assert.deepEqual(parseEmbedUrl("https://fb.watch/xyz"), { platform: "facebook", inferredType: "video" });
  assert.deepEqual(parseEmbedUrl("no es un link"), { platform: null, inferredType: null });
  // Un dominio que solo "termina" en tiktok.com no cuenta.
  assert.equal(parseEmbedUrl("https://eviltiktok.com/video/1").platform, null);
});

test("tiktokPostId sirve para videos y fotos", () => {
  assert.equal(tiktokPostId("https://www.tiktok.com/@a/video/7551"), "7551");
  assert.equal(tiktokPostId("https://www.tiktok.com/@a/photo/7552?x=1"), "7552");
  assert.equal(tiktokPostId("https://www.tiktok.com/@a"), null);
});

test("tiktokCanonicalUrl quita el rastreo y pasa /photo/ a /video/", () => {
  assert.equal(
    tiktokCanonicalUrl("https://www.tiktok.com/@a/photo/7552?is_from_webapp=1&sender_device=pc#x"),
    "https://www.tiktok.com/@a/video/7552"
  );
  assert.equal(tiktokCanonicalUrl("::"), "::");
});
