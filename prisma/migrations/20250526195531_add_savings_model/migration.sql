/*
  Warnings:

  - The values [Expense,Income] on the enum `CategoryType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('SAVINGS', 'INVESTMENT');

-- AlterEnum
BEGIN;
CREATE TYPE "CategoryType_new" AS ENUM ('EXPENSE', 'INCOME');
ALTER TABLE "Category" ALTER COLUMN "type" TYPE "CategoryType_new" USING ("type"::text::"CategoryType_new");
ALTER TYPE "CategoryType" RENAME TO "CategoryType_old";
ALTER TYPE "CategoryType_new" RENAME TO "CategoryType";
DROP TYPE "CategoryType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Monthly Budget';

-- CreateTable
CREATE TABLE "Savings" (
    "id" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "growth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accountType" "AccountType" NOT NULL DEFAULT 'SAVINGS',
    "institution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Savings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Savings" ADD CONSTRAINT "Savings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Savings" ADD CONSTRAINT "Savings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
