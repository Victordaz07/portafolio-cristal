-- CreateTable
CREATE TABLE "CommunityConversation" (
    "id" TEXT NOT NULL,
    "aId" TEXT NOT NULL,
    "bId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSenderId" TEXT,
    "aReadAt" TIMESTAMP(3),
    "bReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "hiddenAt" TIMESTAMP(3),
    "hiddenBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityConversation_aId_lastMessageAt_idx" ON "CommunityConversation"("aId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "CommunityConversation_bId_lastMessageAt_idx" ON "CommunityConversation"("bId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityConversation_aId_bId_key" ON "CommunityConversation"("aId", "bId");

-- CreateIndex
CREATE INDEX "CommunityMessage_conversationId_createdAt_idx" ON "CommunityMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "CommunityConversation" ADD CONSTRAINT "CommunityConversation_aId_fkey" FOREIGN KEY ("aId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityConversation" ADD CONSTRAINT "CommunityConversation_bId_fkey" FOREIGN KEY ("bId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMessage" ADD CONSTRAINT "CommunityMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CommunityConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

