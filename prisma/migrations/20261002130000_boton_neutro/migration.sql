-- Las cuentas nuevas se creaban con el botón "Trabajemos juntas" por defecto. Pasa a "Colaboremos"
-- en todas las que no lo cambiaron, excepto Cristal (es su texto y la describe a ella).
UPDATE "Hero"
SET "ctaSecondaryLabel" = 'Colaboremos'
WHERE "ctaSecondaryLabel" = 'Trabajemos juntas'
  AND "creatorId" <> 'creator_cristal';
