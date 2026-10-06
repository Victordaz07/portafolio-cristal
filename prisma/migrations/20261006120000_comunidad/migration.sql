-- Comunidad Foliocrew: perfiles, publicaciones, respuestas, "me sirvió", reportes y bloqueos
-- AlterTable

-- CreateTable
CREATE TABLE "CommunityProfile" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "headline" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "avatarUrl" TEXT,
    "city" TEXT,
    "showCity" BOOLEAN NOT NULL DEFAULT true,
    "showSite" BOOLEAN NOT NULL DEFAULT true,
    "creatorTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "niche" TEXT,
    "languages" TEXT[] DEFAULT ARRAY['es']::TEXT[],
    "openToCollab" BOOLEAN NOT NULL DEFAULT false,
    "reputation" INTEGER NOT NULL DEFAULT 0,
    "mutedUntil" TIMESTAMP(3),
    "acceptedRulesAt" TIMESTAMP(3),
    "emailNotify" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "topic" TEXT NOT NULL DEFAULT 'otro',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "creatorTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "bestReplyId" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "fromTeam" BOOLEAN NOT NULL DEFAULT false,
    "hiddenAt" TIMESTAMP(3),
    "hiddenBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityReply" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "hiddenAt" TIMESTAMP(3),
    "hiddenBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityReaction" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'open',
    "handledBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "CommunityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityProfile_creatorId_key" ON "CommunityProfile"("creatorId");

-- CreateIndex
CREATE INDEX "CommunityProfile_niche_idx" ON "CommunityProfile"("niche");

-- CreateIndex
CREATE INDEX "CommunityPost_createdAt_idx" ON "CommunityPost"("createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_lastActivityAt_idx" ON "CommunityPost"("lastActivityAt");

-- CreateIndex
CREATE INDEX "CommunityPost_kind_topic_idx" ON "CommunityPost"("kind", "topic");

-- CreateIndex
CREATE INDEX "CommunityPost_creatorId_idx" ON "CommunityPost"("creatorId");

-- CreateIndex
CREATE INDEX "CommunityReply_postId_createdAt_idx" ON "CommunityReply"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityReply_creatorId_idx" ON "CommunityReply"("creatorId");

-- CreateIndex
CREATE INDEX "CommunityReaction_targetType_targetId_idx" ON "CommunityReaction"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityReaction_creatorId_targetType_targetId_key" ON "CommunityReaction"("creatorId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "CommunityReport_status_createdAt_idx" ON "CommunityReport"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityReport_reporterId_targetType_targetId_key" ON "CommunityReport"("reporterId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "CommunityBlock_blockedId_idx" ON "CommunityBlock"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityBlock_blockerId_blockedId_key" ON "CommunityBlock"("blockerId", "blockedId");

-- AddForeignKey
ALTER TABLE "CommunityProfile" ADD CONSTRAINT "CommunityProfile_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReply" ADD CONSTRAINT "CommunityReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReply" ADD CONSTRAINT "CommunityReply_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReply" ADD CONSTRAINT "CommunityReply_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CommunityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

