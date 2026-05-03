-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('ADMIN', 'MEMBER', 'COOK');

-- CreateEnum
CREATE TYPE "GroceryUrgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "GroceryRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'ADDED_TO_CART', 'ORDERED', 'REJECTED', 'PURCHASED_OFFLINE');

-- CreateEnum
CREATE TYPE "CartDraftStatus" AS ENUM ('DRAFT', 'READY_FOR_APPROVAL', 'APPROVED', 'ORDERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GroceryProvider" AS ENUM ('MOCK', 'SWIGGY_INSTAMART');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'LIMITED', 'UNAVAILABLE', 'SUBSTITUTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdMember" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "HouseholdRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryItem" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "defaultUnit" TEXT,
    "synonyms" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryRequest" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "groceryItemId" TEXT,
    "rawText" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "category" TEXT NOT NULL,
    "urgency" "GroceryUrgency" NOT NULL DEFAULT 'MEDIUM',
    "status" "GroceryRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrocerySynonym" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "synonym" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrocerySynonym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroceryPreference" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "groceryItemId" TEXT NOT NULL,
    "preferredBrand" TEXT,
    "preferredQuantity" DOUBLE PRECISION,
    "preferredUnit" TEXT,
    "avoidBrands" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroceryPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartDraft" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "status" "CartDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "estimatedTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "provider" "GroceryProvider" NOT NULL DEFAULT 'MOCK',
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartDraftId" TEXT NOT NULL,
    "groceryRequestId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "brand" TEXT,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "availabilityStatus" "AvailabilityStatus" NOT NULL,
    "substitutionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "cartDraftId" TEXT NOT NULL,
    "provider" "GroceryProvider" NOT NULL,
    "externalOrderId" TEXT,
    "status" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "placedBy" TEXT NOT NULL,
    "placedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "groceryItemId" TEXT,
    "productName" TEXT NOT NULL,
    "brand" TEXT,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringPattern" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "groceryItemId" TEXT NOT NULL,
    "averageIntervalDays" INTEGER NOT NULL,
    "usualQuantity" DOUBLE PRECISION,
    "usualUnit" TEXT,
    "preferredBrand" TEXT,
    "lastOrderedAt" TIMESTAMP(3),
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorySuggestionDismissal" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "suggestionKey" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "dismissedBy" TEXT,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemorySuggestionDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdMember_householdId_userId_key" ON "HouseholdMember"("householdId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryItem_canonicalName_key" ON "GroceryItem"("canonicalName");

-- CreateIndex
CREATE INDEX "GroceryRequest_householdId_status_idx" ON "GroceryRequest"("householdId", "status");

-- CreateIndex
CREATE INDEX "GroceryRequest_householdId_canonicalName_idx" ON "GroceryRequest"("householdId", "canonicalName");

-- CreateIndex
CREATE UNIQUE INDEX "GrocerySynonym_synonym_key" ON "GrocerySynonym"("synonym");

-- CreateIndex
CREATE INDEX "GrocerySynonym_canonicalName_idx" ON "GrocerySynonym"("canonicalName");

-- CreateIndex
CREATE UNIQUE INDEX "GroceryPreference_householdId_groceryItemId_key" ON "GroceryPreference"("householdId", "groceryItemId");

-- CreateIndex
CREATE INDEX "CartDraft_householdId_status_idx" ON "CartDraft"("householdId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_cartDraftId_key" ON "Order"("cartDraftId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringPattern_householdId_groceryItemId_key" ON "RecurringPattern"("householdId", "groceryItemId");

-- CreateIndex
CREATE INDEX "MemorySuggestionDismissal_householdId_canonicalName_idx" ON "MemorySuggestionDismissal"("householdId", "canonicalName");

-- CreateIndex
CREATE INDEX "MemorySuggestionDismissal_householdId_expiresAt_idx" ON "MemorySuggestionDismissal"("householdId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MemorySuggestionDismissal_householdId_suggestionKey_key" ON "MemorySuggestionDismissal"("householdId", "suggestionKey");

-- CreateIndex
CREATE INDEX "AuditLog_householdId_entityType_entityId_idx" ON "AuditLog"("householdId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryRequest" ADD CONSTRAINT "GroceryRequest_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryRequest" ADD CONSTRAINT "GroceryRequest_groceryItemId_fkey" FOREIGN KEY ("groceryItemId") REFERENCES "GroceryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryRequest" ADD CONSTRAINT "GroceryRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryPreference" ADD CONSTRAINT "GroceryPreference_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroceryPreference" ADD CONSTRAINT "GroceryPreference_groceryItemId_fkey" FOREIGN KEY ("groceryItemId") REFERENCES "GroceryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartDraft" ADD CONSTRAINT "CartDraft_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartDraft" ADD CONSTRAINT "CartDraft_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartDraft" ADD CONSTRAINT "CartDraft_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartDraftId_fkey" FOREIGN KEY ("cartDraftId") REFERENCES "CartDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_groceryRequestId_fkey" FOREIGN KEY ("groceryRequestId") REFERENCES "GroceryRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_cartDraftId_fkey" FOREIGN KEY ("cartDraftId") REFERENCES "CartDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_placedBy_fkey" FOREIGN KEY ("placedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_groceryItemId_fkey" FOREIGN KEY ("groceryItemId") REFERENCES "GroceryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringPattern" ADD CONSTRAINT "RecurringPattern_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringPattern" ADD CONSTRAINT "RecurringPattern_groceryItemId_fkey" FOREIGN KEY ("groceryItemId") REFERENCES "GroceryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorySuggestionDismissal" ADD CONSTRAINT "MemorySuggestionDismissal_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorySuggestionDismissal" ADD CONSTRAINT "MemorySuggestionDismissal_dismissedBy_fkey" FOREIGN KEY ("dismissedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
