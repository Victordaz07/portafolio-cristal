-- Verificación en dos pasos (código de 6 dígitos de una app de autenticación) y bloqueo temporal
-- por intentos fallidos de entrar. Todo opcional: las cuentas que ya existen siguen entrando igual.
ALTER TABLE "AdminUser" ADD COLUMN "totpSecret" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "totpEnabledAt" TIMESTAMP(3);
ALTER TABLE "AdminUser" ADD COLUMN "totpLastStep" INTEGER;
ALTER TABLE "AdminUser" ADD COLUMN "totpRecoveryCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "AdminUser" ADD COLUMN "failedLogins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AdminUser" ADD COLUMN "lockedUntil" TIMESTAMP(3);
