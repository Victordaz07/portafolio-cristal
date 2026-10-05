-- Respuestas enviadas desde la Bandeja: Meta no dice quién escribió una respuesta, así que Foliocrew
-- guarda los ids de las suyas para reconocerlas.
CREATE TABLE IF NOT EXISTS "InboxReply" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "platform" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InboxReply_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InboxReply_creatorId_platform_idx" ON "InboxReply"("creatorId", "platform");

DO $$ BEGIN
  ALTER TABLE "InboxReply" ADD CONSTRAINT "InboxReply_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
