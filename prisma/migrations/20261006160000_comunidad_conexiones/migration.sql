-- CreateTable
CREATE TABLE "CommunityConnection" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "CommunityConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityConnection_addresseeId_status_idx" ON "CommunityConnection"("addresseeId", "status");

-- CreateIndex
CREATE INDEX "CommunityConnection_requesterId_status_idx" ON "CommunityConnection"("requesterId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityConnection_requesterId_addresseeId_key" ON "CommunityConnection"("requesterId", "addresseeId");

-- AddForeignKey
ALTER TABLE "CommunityConnection" ADD CONSTRAINT "CommunityConnection_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityConnection" ADD CONSTRAINT "CommunityConnection_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

