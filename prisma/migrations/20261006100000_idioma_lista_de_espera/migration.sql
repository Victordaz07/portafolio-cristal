-- Idioma de quien se anota en la lista de espera (para mandarle los correos en su idioma)
ALTER TABLE "WaitlistEntry" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'es';
