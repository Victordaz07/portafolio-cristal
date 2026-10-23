import { test } from "node:test";
import assert from "node:assert/strict";
import { prismaRoot } from "../lib/prisma-root";
import { moduleEnabledFor, moduleStage, setModuleStage } from "../lib/module-flags";

// Sistema de módulos por etapas (Mercado de creadores): off/ambassadors/public. Prueba contra
// Postgres real, igual que tests/agency-access.test.ts.
const skip = !process.env.DATABASE_URL;

test("un módulo nunca tocado está apagado para todo el mundo", { skip }, async () => {
  const key = `test_modulo_nuevo_${Date.now()}` as import("../lib/module-flags").ModuleKey;
  assert.equal(await moduleStage(key), "off");
  assert.equal(await moduleEnabledFor(key, { ambassador: true }), false);
  assert.equal(await moduleEnabledFor(key, { ambassador: false }), false);
  assert.equal(await moduleEnabledFor(key, null), false);
});

test("en etapa 'ambassadors' solo lo ve una cuenta embajadora", { skip }, async () => {
  const key = `test_modulo_${Date.now()}` as import("../lib/module-flags").ModuleKey;
  try {
    await setModuleStage(key, "ambassadors", "dueño@test.foliocrew.pro");
    assert.equal(await moduleStage(key), "ambassadors");
    assert.equal(await moduleEnabledFor(key, { ambassador: true }), true);
    assert.equal(await moduleEnabledFor(key, { ambassador: false }), false);
    assert.equal(await moduleEnabledFor(key, null), false);
  } finally {
    await prismaRoot.moduleFlag.deleteMany({ where: { key } });
  }
});

test("en etapa 'public' lo ve cualquier cuenta", { skip }, async () => {
  const key = `test_modulo_publico_${Date.now()}` as import("../lib/module-flags").ModuleKey;
  try {
    await setModuleStage(key, "public", "dueño@test.foliocrew.pro");
    assert.equal(await moduleEnabledFor(key, { ambassador: false }), true);
    assert.equal(await moduleEnabledFor(key, null), true);
  } finally {
    await prismaRoot.moduleFlag.deleteMany({ where: { key } });
  }
});
