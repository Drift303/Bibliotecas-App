-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('HOME', 'IN_LIBRARY');

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "loanType" "LoanType" NOT NULL DEFAULT 'HOME';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gender" "Gender";

-- CreateIndex
CREATE INDEX "Loan_departmentId_idx" ON "Loan"("departmentId");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
