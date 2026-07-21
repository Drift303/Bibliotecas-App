-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('SCHOOL', 'PUBLIC_LIBRARY');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "type" "TenantType" NOT NULL DEFAULT 'SCHOOL';