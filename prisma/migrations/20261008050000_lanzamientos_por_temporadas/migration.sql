-- Lanzamiento por temporadas: posición de cada módulo del panel (apagado, embajadores o todos).
-- Sin filas, cada módulo usa su posición por defecto (lib/releases.ts).
CREATE TABLE "FeatureRelease" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "publicAt" TIMESTAMP(3),
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureRelease_pkey" PRIMARY KEY ("id")
);
