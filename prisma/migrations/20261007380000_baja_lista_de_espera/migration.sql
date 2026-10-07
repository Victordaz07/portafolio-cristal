-- Baja de los correos de la lista de espera (enlace "darme de baja" de cada correo): quien se dio de baja
-- no vuelve a recibir invitaciones.
ALTER TABLE "WaitlistEntry" ADD COLUMN "unsubscribedAt" TIMESTAMP(3);

-- Registro: cuándo la persona confirmó que tiene 18 años o más y aceptó los términos y la privacidad.
ALTER TABLE "AdminUser" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
