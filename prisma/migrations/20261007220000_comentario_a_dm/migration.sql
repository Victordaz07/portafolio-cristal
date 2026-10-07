
-- CreateTable
CREATE TABLE "CommentTrigger" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "mediaId" TEXT NOT NULL,
    "mediaLabel" TEXT NOT NULL DEFAULT '',
    "keyword" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentTriggerHit" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "triggerId" TEXT NOT NULL,
    "commenterId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentTriggerHit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommentTrigger_mediaId_active_idx" ON "CommentTrigger"("mediaId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "CommentTrigger_creatorId_mediaId_keyword_key" ON "CommentTrigger"("creatorId", "mediaId", "keyword");

-- CreateIndex
CREATE UNIQUE INDEX "CommentTriggerHit_commentId_key" ON "CommentTriggerHit"("commentId");

-- CreateIndex
CREATE INDEX "CommentTriggerHit_creatorId_createdAt_idx" ON "CommentTriggerHit"("creatorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommentTriggerHit_triggerId_commenterId_key" ON "CommentTriggerHit"("triggerId", "commenterId");

-- AddForeignKey
ALTER TABLE "CommentTrigger" ADD CONSTRAINT "CommentTrigger_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentTriggerHit" ADD CONSTRAINT "CommentTriggerHit_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentTriggerHit" ADD CONSTRAINT "CommentTriggerHit_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "CommentTrigger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

