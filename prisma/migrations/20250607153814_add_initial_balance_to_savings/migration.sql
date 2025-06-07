/*
  Warnings:

  - Added the required column `initialBalance` to the `Savings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Savings" ADD COLUMN     "initialBalance" DOUBLE PRECISION NOT NULL;
