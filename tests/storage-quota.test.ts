import { test } from "node:test";
import assert from "node:assert/strict";
import { mediaPieceLimit, mediaQuota, StorageQuotaError, assertMediaQuota } from "../lib/storage-quota";
import { prismaRoot } from "../lib/prisma-root";
import { runAsCreator } from "../lib/tenant";

test("mediaPieceLimit por plan y por variable de entorno", () => {
  assert.equal(mediaPieceLimit("folio"), 40);
  assert.equal(mediaPieceLimit("pro"), 150);
  assert.equal(mediaPieceLimit("crew"), 400);
  assert.equal(mediaPieceLimit("folio", true), 400); // cortesía -> tope de crew
  assert.equal(mediaPieceLimit("desconocido"), 150); // plan raro -> tope de pro
  process.env.STORAGE_MAX_PIECES_FOLIO = "7";
  assert.equal(mediaPieceLimit("folio"), 7);
  process.env.STORAGE_MAX_PIECES_FOLIO = "abc";
  assert.equal(mediaPieceLimit("folio"), 40);
  delete process.env.STORAGE_MAX_PIECES_FOLIO;
});

// Control crítico de costos: la cuota de almacenamiento solo cuenta piezas con archivo propio
// (photoUrl/videoUrl), nunca un post solo enlazado (no ocupa nuestro Blob). Necesita Postgres real
// (como en CI); si no hay DATABASE_URL se salta en vez de fallar.
const skip = !process.env.DATABASE_URL;

test("assertMediaQuota cuenta solo piezas con media propia, no posts enlazados", { skip }, async () => {
  const originalLimit = process.env.STORAGE_MAX_PIECES_FOLIO;
  process.env.STORAGE_MAX_PIECES_FOLIO = "2";
  const creator = await prismaRoot.creator.create({
    data: { slug: `storage-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: "Prueba de cuota", plan: "folio" },
  });

  try {
    await runAsCreator(creator.id, async () => {
      // Un post solo enlazado (sin photoUrl/videoUrl) no debe contar contra la cuota.
      await prismaRoot.contentCard.create({
        data: { creatorId: creator.id, type: "video", platform: "tiktok", postUrl: "https://www.tiktok.com/@x/video/1", caption: "x", category: "x", order: 0 },
      });
      const afterLink = await mediaQuota();
      assert.equal(afterLink.used, 0, "un post solo enlazado no debe contar contra la cuota");

      // Dos piezas con archivo propio sí llenan el tope de 2.
      await prismaRoot.contentCard.create({
        data: { creatorId: creator.id, type: "photo", platform: "ugc", photoUrl: "https://x.public.blob.vercel-storage.com/a.jpg", caption: "a", category: "a", order: 1 },
      });
      await prismaRoot.contentCard.create({
        data: { creatorId: creator.id, type: "video", platform: "ugc", videoUrl: "https://x.public.blob.vercel-storage.com/b.mp4", caption: "b", category: "b", order: 2 },
      });

      const quota = await mediaQuota();
      assert.equal(quota.used, 2);
      assert.equal(quota.limit, 2);

      await assert.rejects(() => assertMediaQuota(), StorageQuotaError, "con el tope ya alcanzado, una pieza nueva debe rechazarse");
    });
  } finally {
    await prismaRoot.contentCard.deleteMany({ where: { creatorId: creator.id } });
    await prismaRoot.creator.delete({ where: { id: creator.id } });
    if (originalLimit === undefined) delete process.env.STORAGE_MAX_PIECES_FOLIO;
    else process.env.STORAGE_MAX_PIECES_FOLIO = originalLimit;
  }
});

test.after(async () => {
  if (!skip) await prismaRoot.$disconnect();
});
