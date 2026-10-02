-- Asistente de bienvenida. Las creadoras que ya existían no lo necesitan.
ALTER TABLE "Creator" ADD COLUMN     "onboardedAt" TIMESTAMP(3);
UPDATE "Creator" SET "onboardedAt" = CURRENT_TIMESTAMP;
