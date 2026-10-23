import { prismaRoot } from "./prisma-root";

// Cada pieza del Mercado de creadores se libera desde el Centro de mando en 3 etapas, sin tocar
// código ni variables de entorno: "off" (nadie la ve), "ambassadors" (solo cuentas embajadoras,
// para probarla primero) o "public" (todo el mundo). No existía ningún sistema así antes de esta
// fase — los flags previos (lib/early-access.ts, PUBLISH_INSTAGRAM_ENABLED, etc.) son variables de
// entorno sueltas por feature, sin UI de administración.

export const MODULE_KEYS = ["metricas_verificadas", "bandeja_colaboraciones", "mercado_directorio", "registro_marcas"] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export type ModuleStage = "off" | "ambassadors" | "public";

export const MODULE_LABELS: Record<ModuleKey, { es: string; en: string }> = {
  metricas_verificadas: { es: "Métricas verificadas", en: "Verified metrics" },
  bandeja_colaboraciones: { es: "Bandeja de colaboraciones", en: "Collaborations inbox" },
  mercado_directorio: { es: "Directorio del mercado", en: "Market directory" },
  registro_marcas: { es: "Registro de marcas", en: "Brand sign-up" },
};

function isModuleKey(value: string): value is ModuleKey {
  return (MODULE_KEYS as readonly string[]).includes(value);
}

// Caché corta (30 s): se consulta en cada página que depende de un módulo, no hace falta pegarle a
// la base en cada petición — igual que sessionState() en lib/tenant.ts.
const stageCache = new Map<ModuleKey, { stage: ModuleStage; expires: number }>();

/** La etapa actual de un módulo ("off" si nunca se tocó). */
export async function moduleStage(key: ModuleKey): Promise<ModuleStage> {
  const cached = stageCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.stage;
  const row = await prismaRoot.moduleFlag.findUnique({ where: { key }, select: { stage: true } });
  const stage: ModuleStage = row?.stage === "ambassadors" || row?.stage === "public" ? row.stage : "off";
  stageCache.set(key, { stage, expires: Date.now() + 30_000 });
  return stage;
}

/** ¿Esta cuenta ve este módulo? "ambassadors" exige account.ambassador; "public" es para cualquiera. */
export async function moduleEnabledFor(key: ModuleKey, account: { ambassador: boolean } | null) {
  const stage = await moduleStage(key);
  if (stage === "public") return true;
  if (stage === "ambassadors") return Boolean(account?.ambassador);
  return false;
}

/** Cambia la etapa de un módulo desde el Centro de mando. */
export async function setModuleStage(key: ModuleKey, stage: ModuleStage, updatedBy: string) {
  await prismaRoot.moduleFlag.upsert({
    where: { key },
    update: { stage, updatedBy },
    create: { key, stage, updatedBy },
  });
  stageCache.delete(key);
}

/** Las etapas de todos los módulos, para la pantalla de administración. */
export async function allModuleStages(): Promise<Record<ModuleKey, ModuleStage>> {
  const rows = await prismaRoot.moduleFlag.findMany({ where: { key: { in: MODULE_KEYS as unknown as string[] } } });
  const byKey = new Map(rows.map((r) => [r.key, r.stage]));
  const result = {} as Record<ModuleKey, ModuleStage>;
  for (const key of MODULE_KEYS) {
    const stage = byKey.get(key);
    result[key] = stage === "ambassadors" || stage === "public" ? stage : "off";
  }
  return result;
}

export { isModuleKey };
