-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'SEMESTER', 'ANNUAL');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "lastPaymentId" TEXT,
ADD COLUMN     "planExpiresAt" TIMESTAMP(3);
