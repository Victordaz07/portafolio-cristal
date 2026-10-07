
-- CreateTable
CREATE TABLE "Circle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "descriptionEn" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'general',
    "crewOnly" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Circle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleMember" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleMessage" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "hiddenAt" TIMESTAMP(3),
    "hiddenBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'live',
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "descriptionEn" TEXT,
    "hostName" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "joinUrl" TEXT NOT NULL,
    "crewOnly" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER,
    "circleId" TEXT,
    "canceledAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionRsvp" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Circle_slug_key" ON "Circle"("slug");

-- CreateIndex
CREATE INDEX "CircleMember_creatorId_idx" ON "CircleMember"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "CircleMember_circleId_creatorId_key" ON "CircleMember"("circleId", "creatorId");

-- CreateIndex
CREATE INDEX "CircleMessage_circleId_createdAt_idx" ON "CircleMessage"("circleId", "createdAt");

-- CreateIndex
CREATE INDEX "LiveSession_startsAt_idx" ON "LiveSession"("startsAt");

-- CreateIndex
CREATE INDEX "SessionRsvp_creatorId_idx" ON "SessionRsvp"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionRsvp_sessionId_creatorId_key" ON "SessionRsvp"("sessionId", "creatorId");

-- AddForeignKey
ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleMessage" ADD CONSTRAINT "CircleMessage_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleMessage" ADD CONSTRAINT "CircleMessage_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRsvp" ADD CONSTRAINT "SessionRsvp_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRsvp" ADD CONSTRAINT "SessionRsvp_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

