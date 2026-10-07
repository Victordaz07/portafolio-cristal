#!/usr/bin/env node
// Modelo de costos de Foliocrew (Fase 4 de la auditoría FinOps, docs/finops/auditoria-foliocrew.md).
//
// Uso:  node scripts/finops/cost-model.mjs
//
// Todos los números de PRECIOS tienen su fuente y fecha al lado. Los números de USO (cuántas
// sugerencias de IA pide una creadora "normal" al mes, cuántas fotos sube, etc.) son SUPUESTOS
// editables marcados como tal: reemplázalos por telemetría real cuando haya suficientes cuentas
// (la tabla AiUsage ya guarda tokens reales por cuenta y función; FollowerSnapshot guarda
// seguidores; ContentCard cuenta piezas por creadora — ver docs/finops/auditoria-foliocrew.md).
//
// No es una factura: es una calculadora paramétrica para decidir límites y precios con fórmulas
// explícitas, no un dashboard. Cambia las constantes de abajo y vuelve a correr el script.

// ───────────────────────── 1. PRECIOS DE PROVEEDORES (con fuente y fecha) ─────────────────────────

const PRICING = {
  // HECHO VERIFICADO — confirmado por acceso directo a la página oficial el 2026-10-06.
  // Fuente: https://claude.com/pricing (Anthropic redirige anthropic.com/pricing -> claude.com/pricing)
  ai: {
    model: "claude-sonnet-5-5",
    inputPerMTok: 2.0, // USD por 1,000,000 tokens de entrada
    outputPerMTok: 10.0, // USD por 1,000,000 tokens de salida
    cachedReadPerMTok: 0.2, // lectura de caché de prompt (90% de descuento) — no se usa hoy en el código
    source: "https://claude.com/pricing",
    checkedAt: "2026-10-06",
  },

  // PRECIO A VERIFICAR — el acceso directo a neon.com está bloqueado desde este entorno de
  // ejecución; estos números vienen de una búsqueda que cita neon.com/pricing pero no se pudo
  // confirmar fetcheando la página oficial directamente. CONFIRMAR en https://neon.com/pricing
  // antes de usar estos números para decidir un precio de venta real.
  neon: {
    computePerCuHourLaunch: 0.106, // 1 CU = 1 vCPU + 4GB RAM
    computePerCuHourScale: 0.222,
    storagePerGbMonth: 0.35,
    egressIncludedGb: 100, // por mes, a nivel de proyecto/cuenta (compartido, no por espacio)
    egressPerGbOverage: 0.1,
    source: "búsqueda web citando neon.com/pricing (no se pudo fetchear la página oficial directamente desde este entorno)",
    checkedAt: "2026-10-06",
    verified: false,
  },

  // PRECIO A VERIFICAR — mismo motivo que Neon: vercel.com bloqueado desde este entorno.
  // CONFIRMAR en https://vercel.com/docs/storage/vercel-blob/usage-and-pricing
  blob: {
    storagePerGbMonth: 0.023, // tarifa de excedente en plan Pro
    bandwidthOveragePerGb: 0.05,
    proIncludedStorageGb: 5,
    proIncludedBandwidthGb: 100,
    hobbyIncludedStorageGb: 1,
    hobbyIncludedBandwidthGb: 10,
    source: "búsqueda web citando vercel.com/docs/storage/vercel-blob/usage-and-pricing (no se pudo fetchear directamente)",
    checkedAt: "2026-10-06",
    verified: false,
  },

  // PRECIO A VERIFICAR — mismo motivo. CONFIRMAR en https://vercel.com/pricing
  vercelHosting: {
    proSeatPerMonth: 20, // por asiento de equipo, no por espacio de creadora
    includedBandwidthGb: 1024, // "Fast Data Transfer" incluido en Pro
    bandwidthOveragePerGb: 0.15, // regiones US
    includedInvocations: 1_000_000,
    invocationOveragePerMillion: 0.6,
    source: "búsqueda web citando vercel.com/pricing (no se pudo fetchear directamente)",
    checkedAt: "2026-10-06",
    verified: false,
  },

  // PRECIO A VERIFICAR — mismo motivo. CONFIRMAR en https://resend.com/pricing
  resend: {
    freeIncluded: 3000, // correos/mes
    proBasePerMonth: 20,
    proIncluded: 50_000,
    overagePer1000: 0.9,
    source: "búsqueda web citando resend.com/pricing (no se pudo fetchear directamente)",
    checkedAt: "2026-10-06",
    verified: false,
  },

  // Pagos: HECHO VERIFICADO — Foliocrew cobra manualmente (PayPal/transferencia, lib/billing.ts),
  // sin pasarela automática. No hay comisión de procesamiento de pago que modelar hoy.
  payments: {
    feePercent: 0,
    feeFixed: 0,
    note: "Sin Stripe ni pasarela automática hoy (confirmado en código). Si se agrega una, usar su tarifa real.",
  },
};

// Planes vendidos hoy (lib/plans.ts) — HECHO VERIFICADO.
const PLANS = {
  folio: { price: 9, aiMonthlyLimit: 60 },
  pro: { price: 19, aiMonthlyLimit: 300 },
  crew: { price: 49, aiMonthlyLimit: 1000 },
};

// ───────────────────────── 2. PERFILES DE USO POR ESPACIO ACTIVO (SUPUESTO) ─────────────────────────
//
// "Espacio activo" = una creadora con su sitio (no cada visitante). Estos números son estimaciones
// editables, NO telemetría real (todavía no hay suficientes cuentas para promediar con confianza).
// Reemplázalos cuando AiUsage/ContentCard/FollowerSnapshot tengan datos de producción reales.

const PROFILES = {
  ligero: {
    label: "Ligero (Folio, apenas empieza)",
    aiCallsPerMonth: 8, // bien por debajo del tope de Folio (60)
    aiInputTokensPerCall: 900, // contexto (nicho + 8 captions recientes) + prompt
    aiOutputTokensPerCall: 450, // 3 captions cortos o 2-3 tips
    photosStoredGb: 0.05, // ~10 fotos livianas (~5MB c/u tras recorte)
    videosStoredGb: 0, // sin video propio (usa posts embebidos de TikTok/IG)
    monthlyVideoPlaysOwnBlob: 0, // no sube video propio
    avgVideoSizeMb: 15,
    monthlyPageVisits: 150,
    monthlyPanelActions: 40, // acciones del panel (guardar, abrir páginas) -> invocaciones de función
    monthlyEmails: 3, // bienvenida/recordatorios ocasionales
  },
  normal: {
    label: "Normal (Pro, activa con marcas)",
    aiCallsPerMonth: 60,
    aiInputTokensPerCall: 1200,
    aiOutputTokensPerCall: 600,
    photosStoredGb: 0.25, // ~40 fotos acumuladas
    videosStoredGb: 0.3, // ~20 videos propios de ~15MB
    monthlyVideoPlaysOwnBlob: 400, // aperturas del lightbox con reproducción completa
    avgVideoSizeMb: 15,
    monthlyPageVisits: 2000,
    monthlyPanelActions: 300,
    monthlyEmails: 15,
  },
  intensivo: {
    label: "Intensivo (Crew o Pro muy activa, viral)",
    aiCallsPerMonth: 280, // cerca del tope de Pro/Crew
    aiInputTokensPerCall: 1500,
    aiOutputTokensPerCall: 700,
    photosStoredGb: 1.0,
    videosStoredGb: 1.5, // ~80 videos
    monthlyVideoPlaysOwnBlob: 6000, // contenido que se volvió viral
    avgVideoSizeMb: 18,
    monthlyPageVisits: 25_000,
    monthlyPanelActions: 900,
    monthlyEmails: 40,
  },
};

// ───────────────────────── 3. FÓRMULAS DE COSTO POR ESPACIO (variable) ─────────────────────────

function aiCostPerSpace(p) {
  const tokensIn = p.aiCallsPerMonth * p.aiInputTokensPerCall;
  const tokensOut = p.aiCallsPerMonth * p.aiOutputTokensPerCall;
  return (tokensIn / 1e6) * PRICING.ai.inputPerMTok + (tokensOut / 1e6) * PRICING.ai.outputPerMTok;
}

function blobBandwidthGbPerSpace(p) {
  // Solo video propio reproducido desde nuestro Blob genera egress nuestro (ver auditoría,
  // hallazgo "video propio egress nuestro"); los posts embebidos de TikTok/IG no cuentan aquí.
  return (p.monthlyVideoPlaysOwnBlob * p.avgVideoSizeMb) / 1024;
}

function blobStorageGbPerSpace(p) {
  return p.photosStoredGb + p.videosStoredGb; // acumulado, no se resta lo borrado (crece con el tiempo)
}

// DB (Neon): el compute es "always on o escala con tráfico", no limpiamente por espacio a esta
// escala. Lo modelamos como costo de PLATAFORMA (sección 4), no por espacio — el storage de filas
// de Postgres por espacio es insignificante (unos KB) y se omite a propósito (SUPUESTO: no material).

function emailCostMarginalPerSpace(p, totalEmailsAllSpaces) {
  // El costo de email es escalonado a nivel de PLATAFORMA (un solo plan de Resend para todos),
  // así que el costo "por espacio" solo tiene sentido como promedio una vez que se sabe el total
  // (ver calculatePlatform). Esta función devuelve solo el conteo, el costo se reparte después.
  return p.monthlyEmails;
}

// ───────────────────────── 4. COSTO DE PLATAFORMA PARA UN ESCENARIO ─────────────────────────

function tieredCost(totalUnits, includedUnits, overagePerUnit) {
  return Math.max(0, totalUnits - includedUnits) * overagePerUnit;
}

function calculateScenario({ totalSpaces, mix, payingShare, planMix, repsOf3Spaces = 0 }) {
  // mix: { ligero: 0.7, normal: 0.25, intensivo: 0.05 } (debe sumar 1)
  const countByProfile = Object.fromEntries(Object.entries(mix).map(([k, share]) => [k, Math.round(totalSpaces * share)]));

  let totalAiCost = 0;
  let totalStorageGb = 0;
  let totalBandwidthGb = 0;
  let totalEmails = 0;
  let totalPanelActions = 0;
  let totalVisits = 0;

  for (const [key, count] of Object.entries(countByProfile)) {
    const p = PROFILES[key];
    totalAiCost += aiCostPerSpace(p) * count;
    totalStorageGb += blobStorageGbPerSpace(p) * count;
    totalBandwidthGb += blobBandwidthGbPerSpace(p) * count;
    totalEmails += emailCostMarginalPerSpace(p) * count;
    totalPanelActions += p.monthlyPanelActions * count;
    totalVisits += p.monthlyPageVisits * count;
  }

  // Vercel Blob: un solo store compartido por la plataforma (ver auditoría, H3 multimedia).
  const blobPlan = totalStorageGb <= PRICING.blob.proIncludedStorageGb && totalBandwidthGb <= PRICING.blob.proIncludedBandwidthGb ? "hobby-o-pro-sin-excedente" : "pro-con-excedente";
  const blobStorageCost = tieredCost(totalStorageGb, PRICING.blob.proIncludedStorageGb, PRICING.blob.storagePerGbMonth);
  const blobBandwidthCost = tieredCost(totalBandwidthGb, PRICING.blob.proIncludedBandwidthGb, PRICING.blob.bandwidthOveragePerGb);

  // Vercel hosting: 1 asiento Pro base + excedente de invocaciones/bandwidth de HTML/JSON (no video,
  // eso ya se contó en Blob). Las visitas y acciones del panel generan invocaciones de función.
  const totalInvocations = totalVisits * 3 + totalPanelActions * 2; // SUPUESTO: ~3 funciones por visita (página+API), ~2 por acción de panel
  const vercelInvocationCost = tieredCost(totalInvocations, PRICING.vercelHosting.includedInvocations, PRICING.vercelHosting.invocationOveragePerMillion / 1_000_000);
  const htmlBandwidthGb = (totalVisits * 0.15) / 1024; // SUPUESTO: ~150KB promedio por visita (HTML+JSON, sin video/imágenes grandes que van por Blob/CDN de imagen)
  const vercelBandwidthCost = tieredCost(htmlBandwidthGb, PRICING.vercelHosting.includedBandwidthGb, PRICING.vercelHosting.bandwidthOveragePerGb);
  const vercelFixed = PRICING.vercelHosting.proSeatPerMonth;

  // Resend: un solo plan compartido.
  const resendPlan = totalEmails <= PRICING.resend.freeIncluded ? "free" : "pro";
  const resendFixed = resendPlan === "free" ? 0 : PRICING.resend.proBasePerMonth;
  const resendIncluded = resendPlan === "free" ? PRICING.resend.freeIncluded : PRICING.resend.proIncluded;
  const resendOverageCost = tieredCost(totalEmails, resendIncluded, PRICING.resend.overagePer1000 / 1000);

  // Neon: compute aproximado por el tráfico total (SUPUESTO grueso: 1 CU activo mientras hay tráfico,
  // escalando con invocaciones; a esta escala es más una aproximación de orden de magnitud que una
  // factura real — Neon con "scale to zero" cobra solo cuando el compute está activo).
  const estimatedActiveHoursPerMonth = Math.min(730, 40 + totalInvocations / 50_000); // SUPUESTO: crece con el tráfico, techo = siempre activo
  const neonComputeCost = estimatedActiveHoursPerMonth * PRICING.neon.computePerCuHourLaunch;
  const neonStorageGbEstimate = 0.3 + totalSpaces * 0.0015; // SUPUESTO: filas de Postgres, no multimedia (eso es Blob)
  const neonStorageCost = neonStorageGbEstimate * PRICING.neon.storagePerGbMonth;

  const totalVariableCost = totalAiCost + blobStorageCost + blobBandwidthCost + resendOverageCost;
  const totalFixedCost = vercelFixed + resendFixed + neonComputeCost + neonStorageCost + vercelInvocationCost + vercelBandwidthCost;
  const totalCost = totalVariableCost + totalFixedCost;

  // Ingreso: solo una fracción de los espacios son cuentas que pagan (resto: prueba gratis, cortesía,
  // embajadoras). planMix reparte esa fracción entre folio/pro/crew.
  const payingSpaces = Math.round(totalSpaces * payingShare);
  let revenue = 0;
  for (const [planId, share] of Object.entries(planMix)) {
    revenue += Math.round(payingSpaces * share) * PLANS[planId].price;
  }

  const contributionMargin = revenue - totalVariableCost;
  const grossMargin = revenue - totalCost;
  const breakevenPayingSpaces = totalFixedCost > 0 && contributionMargin > 0 ? Math.ceil(totalFixedCost / (contributionMargin / Math.max(payingSpaces, 1))) : null;

  return {
    totalSpaces,
    countByProfile,
    totalAiCost,
    blobStorageCost,
    blobBandwidthCost,
    vercelFixed,
    vercelInvocationCost,
    vercelBandwidthCost,
    resendFixed,
    resendOverageCost,
    neonComputeCost,
    neonStorageCost,
    totalVariableCost,
    totalFixedCost,
    totalCost,
    payingSpaces,
    revenue,
    contributionMargin,
    grossMargin,
    breakevenPayingSpaces,
    costPerSpace: totalCost / totalSpaces,
  };
}

// ───────────────────────── 5. ESCENARIOS PEDIDOS ─────────────────────────

const MIX_DEFAULT = { ligero: 0.65, normal: 0.3, intensivo: 0.05 }; // SUPUESTO editable
const PLAN_MIX_DEFAULT = { folio: 0.5, pro: 0.42, crew: 0.08 }; // SUPUESTO editable
const PAYING_SHARE_DEFAULT = 0.55; // SUPUESTO: resto en prueba gratis/cortesía/embajadora

const scenarios = [100, 1000, 10_000, 100_000].map((totalSpaces) =>
  calculateScenario({ totalSpaces, mix: MIX_DEFAULT, payingShare: PAYING_SHARE_DEFAULT, planMix: PLAN_MIX_DEFAULT })
);

function fmt(n) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

console.log("═══ Modelo de costos Foliocrew — escenarios (SUPUESTOS de uso editables arriba en el script) ═══\n");
for (const s of scenarios) {
  console.log(`— ${s.totalSpaces.toLocaleString()} espacios activos (${s.payingSpaces.toLocaleString()} pagan) —`);
  console.log(`  Mezcla de uso: ${JSON.stringify(s.countByProfile)}`);
  console.log(`  Costo IA:            ${fmt(s.totalAiCost)}`);
  console.log(`  Costo Blob storage:  ${fmt(s.blobStorageCost)}`);
  console.log(`  Costo Blob bandwidth:${fmt(s.blobBandwidthCost)}`);
  console.log(`  Vercel (fijo+excedente): ${fmt(s.vercelFixed + s.vercelInvocationCost + s.vercelBandwidthCost)}`);
  console.log(`  Resend (fijo+excedente): ${fmt(s.resendFixed + s.resendOverageCost)}`);
  console.log(`  Neon (compute+storage):  ${fmt(s.neonComputeCost + s.neonStorageCost)}`);
  console.log(`  COSTO TOTAL:         ${fmt(s.totalCost)}  (${fmt(s.costPerSpace)} / espacio activo)`);
  console.log(`  Ingreso estimado:    ${fmt(s.revenue)}`);
  console.log(`  Contribución (ingreso - variable): ${fmt(s.contributionMargin)}`);
  console.log(`  Margen bruto (ingreso - total):     ${fmt(s.grossMargin)}`);
  console.log(`  Punto de equilibrio (cuentas que pagan): ${s.breakevenPayingSpaces ?? "n/a"}`);
  console.log("");
}

// ───────────────────────── 6. CUENTA CON VARIOS ESPACIOS (representante) ─────────────────────────
//
// IMPORTANTE (hallazgo de la auditoría): lib/plans.ts anuncia el plan Crew ($49) con "Hasta 5
// perfiles de creador", pero esto es SOLO TEXTO DE MARKETING hoy: no existe ninguna tabla de
// pertenencia usuario↔espacio en el schema (AdminUser tiene un único creatorId). Antes de vender
// Crew como "una cuenta, varias creadoras", hay que construir esa funcionalidad (ver
// docs/finops/auditoria-foliocrew.md, hallazgo P1-6/sección 2 del informe de DB). Este cálculo es
// una PROPUESTA de cómo se vería el costo, asumiendo que ya existiera.

const repProfile = PROFILES.normal;
const repCostPerSpace = aiCostPerSpace(repProfile) + blobStorageGbPerSpace(repProfile) * PRICING.blob.storagePerGbMonth + blobBandwidthGbPerSpace(repProfile) * PRICING.blob.bandwidthOveragePerGb;
console.log("═══ Representante con 3 espacios (perfil normal cada uno) — PROPUESTA, feature no construida ═══");
console.log(`  Costo variable estimado por espacio: ${fmt(repCostPerSpace)}`);
console.log(`  Costo variable total (3 espacios):   ${fmt(repCostPerSpace * 3)}`);
console.log(`  Si pagara 1 plan Crew ($49):          contribución ${fmt(49 - repCostPerSpace * 3)}`);
console.log(`  Si pagara 3 planes Pro ($19 c/u = $57): contribución ${fmt(57 - repCostPerSpace * 3)}`);
console.log("");

// ───────────────────────── 7. SENSIBILIDAD ─────────────────────────

console.log("═══ Sensibilidad (sobre el escenario de 1,000 espacios) ═══");
const base = calculateScenario({ totalSpaces: 1000, mix: MIX_DEFAULT, payingShare: PAYING_SHARE_DEFAULT, planMix: PLAN_MIX_DEFAULT });
const viral = calculateScenario({ totalSpaces: 1000, mix: { ligero: 0.4, normal: 0.3, intensivo: 0.3 }, payingShare: PAYING_SHARE_DEFAULT, planMix: PLAN_MIX_DEFAULT });
console.log(`  Base:                         costo total ${fmt(base.totalCost)}`);
console.log(`  30% de cuentas se vuelven virales (intensivo): costo total ${fmt(viral.totalCost)}  (+${fmt(viral.totalCost - base.totalCost)})`);

const retryStorm = { ...PROFILES.normal, aiCallsPerMonth: PROFILES.normal.aiCallsPerMonth * 1.5 }; // reintentos/errores no controlados
const retryCost = aiCostPerSpace(retryStorm) - aiCostPerSpace(PROFILES.normal);
console.log(`  +50% de llamadas de IA por reintentos sin control (por espacio "normal"): +${fmt(retryCost)}/mes por espacio`);

console.log("\nVer docs/finops/modelo-costos.md para las fórmulas explicadas y las fuentes de cada precio.");
