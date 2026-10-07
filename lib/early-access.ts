// Acceso anticipado para embajadoras (G5): una bandera por función. Una función en esta lista es solo para
// embajadoras (y quien administra Foliocrew) hasta que se lance a todas; para lanzarla a todas se quita de la lista
// (o se pone en EARLY_ACCESS_RELEASED separada por comas, sin tocar el código).

export interface EarlyFeature {
  id: string;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
}

/** Funciones que hoy están solo para embajadoras. Vacío por ahora: se llena cuando haya algo nuevo que probar primero. */
export const EARLY_FEATURES: EarlyFeature[] = [];

const released = () => (process.env.EARLY_ACCESS_RELEASED ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** ¿Puede ver esta función? Las ya lanzadas (o desconocidas) las ve todo el mundo; las anticipadas, solo embajadoras. */
export function hasEarlyAccess(featureId: string, account: { ambassador: boolean }, features: EarlyFeature[] = EARLY_FEATURES) {
  const feature = features.find((f) => f.id === featureId);
  if (!feature || released().includes(featureId)) return true;
  return account.ambassador;
}

/** Las funciones que una cuenta puede probar antes que el resto (para mostrarlas en su panel). */
export const earlyFeaturesFor = (account: { ambassador: boolean }, features: EarlyFeature[] = EARLY_FEATURES) =>
  account.ambassador ? features.filter((f) => !released().includes(f.id)) : [];
