-- CreateTable
CREATE TABLE "BrandAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "country" TEXT,
    "category" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "verification" TEXT NOT NULL DEFAULT 'pendiente',
    "trustSignals" JSONB,
    "trustScore" INTEGER,
    "reviewNote" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandSocialConnection" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "followers" INTEGER,
    "isVerifiedBadge" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "BrandSocialConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorMarketProfile" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL DEFAULT '',
    "isListed" BOOLEAN NOT NULL DEFAULT false,
    "isAdult" BOOLEAN NOT NULL DEFAULT false,
    "hispanicAudience" BOOLEAN NOT NULL DEFAULT false,
    "niches" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contentLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audienceCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publicMetrics" JSONB NOT NULL DEFAULT '{}',
    "removedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorMarketProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'off',
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrandAccount_email_key" ON "BrandAccount"("email");

-- CreateIndex
CREATE INDEX "BrandAccount_verification_idx" ON "BrandAccount"("verification");

-- CreateIndex
CREATE UNIQUE INDEX "BrandSocialConnection_brandId_platform_key" ON "BrandSocialConnection"("brandId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorMarketProfile_creatorId_key" ON "CreatorMarketProfile"("creatorId");

-- CreateIndex
CREATE INDEX "CreatorMarketProfile_isListed_idx" ON "CreatorMarketProfile"("isListed");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleFlag_key_key" ON "ModuleFlag"("key");

-- AddForeignKey
ALTER TABLE "BrandSocialConnection" ADD CONSTRAINT "BrandSocialConnection_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorMarketProfile" ADD CONSTRAINT "CreatorMarketProfile_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
