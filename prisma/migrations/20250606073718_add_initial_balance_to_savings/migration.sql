/*
  Warnings:

  - You are about to drop the column `growth` on the `Savings` table. All the data in the column will be lost.
  - Added the required column `initialBalance` to the `Savings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Savings" DROP COLUMN "growth",
ADD COLUMN     "initialBalance" DOUBLE PRECISION NOT NULL;
