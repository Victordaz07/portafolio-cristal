-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '✨',
    "name" TEXT NOT NULL,
    "items" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- Seed initial packages
INSERT INTO "Package" ("id", "emoji", "name", "items", "order") VALUES
(
    'pkg-inicial',
    '✨',
    'Paquete Inicial',
    ARRAY[
        '2-3 videos UGC',
        'Demostración de producto',
        'Voz en off o hablando a cámara',
        'Iluminación natural',
        'Formato vertical (9:16)',
        'Edición estilo orgánico'
    ],
    0
),
(
    'pkg-crecimiento',
    '🚀',
    'Paquete de Crecimiento',
    ARRAY[
        '5-7 videos UGC',
        'Diferentes ganchos (hooks)',
        'Múltiples llamados a la acción',
        'Tomas de estilo de vida + producto',
        'Metraje B-Roll',
        'Sugerencias de captions'
    ],
    1
),
(
    'pkg-premium',
    '💎',
    'Paquete Premium de Marca',
    ARRAY[
        '10+ videos UGC',
        'Múltiples conceptos',
        'Diferentes ganchos y ángulos',
        'Fotografía de producto',
        'Metraje crudo disponible',
        'Creativos estilo anuncio',
        'Versiones orgánicas y para pauta',
        'Guion incluido',
        'Sugerencias de miniaturas'
    ],
    2
);
