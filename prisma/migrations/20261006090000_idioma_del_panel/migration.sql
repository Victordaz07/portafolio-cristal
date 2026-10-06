-- Idioma del panel y de los correos
ALTER TABLE "AdminUser" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'es';
