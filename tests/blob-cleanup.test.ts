import { test } from "node:test";
import assert from "node:assert/strict";
import { isOwnBlobUrl } from "../lib/blob-cleanup";

// Control crítico de costos: nunca borrar un archivo que no es nuestro (enlace externo pegado a mano).

test("isOwnBlobUrl acepta solo nuestro store de Vercel Blob", () => {
  assert.equal(isOwnBlobUrl("https://abc123.public.blob.vercel-storage.com/content-cards/photo/x.jpg"), true);
  assert.equal(isOwnBlobUrl("https://abc123.public.blob.vercel-storage.com/hero/foto.webp?x=1"), true);
});

test("isOwnBlobUrl rechaza enlaces externos (post de red social, dominio ajeno)", () => {
  assert.equal(isOwnBlobUrl("https://www.tiktok.com/@foliocrew/video/123"), false);
  assert.equal(isOwnBlobUrl("https://www.instagram.com/reel/abc/"), false);
  assert.equal(isOwnBlobUrl("https://cdn.alguien-mas.com/foto.jpg"), false);
});

test("isOwnBlobUrl no se deja engañar por un dominio que solo 'termina parecido'", () => {
  // Sin el punto antes de vercel-storage.com no cuenta (mismo cuidado que con tiktok.com en embeds.test.ts).
  assert.equal(isOwnBlobUrl("https://notvercel-storage.com/x.jpg"), false);
});

test("isOwnBlobUrl no revienta con una URL inválida", () => {
  assert.equal(isOwnBlobUrl("no es una url"), false);
  assert.equal(isOwnBlobUrl(""), false);
});
