/*
  Warnings:

  - You are about to drop the column `maxPrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `minPrice` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "maxPrice",
DROP COLUMN "minPrice";
