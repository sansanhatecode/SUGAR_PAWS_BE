/*
  Warnings:

  - Added the required column `vendor` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "vendor" TEXT NOT NULL;
