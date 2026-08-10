-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "replacementCost" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "lastReminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "finePerDay" DOUBLE PRECISION NOT NULL DEFAULT 5.0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT;

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Department_tenantId_idx" ON "Department"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_tenantId_name_key" ON "Department"("tenantId", "name");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
