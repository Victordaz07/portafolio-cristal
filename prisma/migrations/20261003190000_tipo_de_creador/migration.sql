-- Foliocrew se abre a creadores de contenido: cada cuenta dice cómo trabaja con marcas.
ALTER TABLE "Creator" ADD COLUMN IF NOT EXISTS "creatorKind" TEXT NOT NULL DEFAULT 'contenido';

-- Las cuentas que ya existían se crearon como UGC: lo conservan (lo cambian en Mi cuenta).
UPDATE "Creator" SET "creatorKind" = 'ugc' WHERE slug <> 'cristal';

-- Cristal ahora es creadora de contenido.
UPDATE "Creator" SET "creatorKind" = 'contenido' WHERE slug = 'cristal';
