import { test } from "node:test";
import assert from "node:assert/strict";
import { prismaRoot } from "../lib/prisma-root";
import { runAsCreator } from "../lib/tenant";
import { AiQuotaError, commitAiUsage, releaseAiUsage, reserveAiUsage } from "../lib/ai";

// Control crítico de costos: el tope mensual de IA se reserva ANTES de llamar a Claude, con un
// advisory lock de Postgres por creadora, para que pedidos concurrentes no superen el tope
// (antes era "contar y comparar" sin lock: dos pedidos a la vez podían pasar los dos). Esta prueba
// necesita una base Postgres real (como en CI, ver .github/workflows/ci.yml); si no hay
// DATABASE_URL configurada, se salta en vez de fallar.
const skip = !process.env.DATABASE_URL;

test("reserveAiUsage respeta el tope mensual incluso con pedidos concurrentes", { skip }, async () => {
  const originalLimit = process.env.AI_MONTHLY_LIMIT_FOLIO;
  process.env.AI_MONTHLY_LIMIT_FOLIO = "3"; // tope bajo a propósito, para que la carrera sea rápida de probar
  const creator = await prismaRoot.creator.create({
    data: { slug: `race-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: "Prueba de carrera", plan: "folio" },
  });

  try {
    // 10 reservas disparadas A LA VEZ para la misma creadora.
    const attempts = await Promise.allSettled(
      Array.from({ length: 10 }, () => runAsCreator(creator.id, () => reserveAiUsage("caption")))
    );

    const ok = attempts.filter((a): a is PromiseFulfilledResult<string> => a.status === "fulfilled");
    const quotaErrors = attempts.filter((a) => a.status === "rejected" && a.reason instanceof AiQuotaError);
    const otherErrors = attempts.filter((a) => a.status === "rejected" && !(a.reason instanceof AiQuotaError));

    assert.equal(otherErrors.length, 0, `no debían ocurrir errores inesperados: ${JSON.stringify(otherErrors)}`);
    assert.equal(ok.length, 3, "deben pasar EXACTAMENTE 3 de las 10 reservas concurrentes (el tope), ni una más");
    assert.equal(quotaErrors.length, 7, "las otras 7 deben rechazarse por AiQuotaError");

    const rowCount = await prismaRoot.aiUsage.count({ where: { creatorId: creator.id } });
    assert.equal(rowCount, 3, "en la base solo deben quedar 3 filas de uso, pase lo que pase con la concurrencia");

    // Confirmar una reserva exitosa guarda los tokens reales.
    await commitAiUsage(ok[0].value, { input_tokens: 123, output_tokens: 45 });
    const committed = await prismaRoot.aiUsage.findUniqueOrThrow({ where: { id: ok[0].value } });
    assert.equal(committed.inputTokens, 123);
    assert.equal(committed.outputTokens, 45);

    // Liberar una reserva (simula que la llamada a Claude falló) no debe cobrar contra el tope.
    await releaseAiUsage(ok[1].value);
    const afterRelease = await prismaRoot.aiUsage.count({ where: { creatorId: creator.id } });
    assert.equal(afterRelease, 2, "liberar una reserva debe quitarla de la cuenta (no cobrar por errores)");

    const newId = await runAsCreator(creator.id, () => reserveAiUsage("tips"));
    assert.ok(newId, "con espacio liberado por la reserva anterior, una reserva nueva debe pasar");
  } finally {
    await prismaRoot.aiUsage.deleteMany({ where: { creatorId: creator.id } });
    await prismaRoot.creator.delete({ where: { id: creator.id } });
    if (originalLimit === undefined) delete process.env.AI_MONTHLY_LIMIT_FOLIO;
    else process.env.AI_MONTHLY_LIMIT_FOLIO = originalLimit;
  }
});

test.after(async () => {
  if (!skip) await prismaRoot.$disconnect();
});
