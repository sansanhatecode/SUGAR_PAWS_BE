/*
  Warnings:

  - You are about to drop the column `cityId` on the `ShippingAddress` table. All the data in the column will be lost.
  - You are about to drop the column `districtId` on the `ShippingAddress` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `ShippingAddress` table. All the data in the column will be lost.
  - You are about to drop the `Address` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `homeNumber` to the `ShippingAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `moreDetail` to the `ShippingAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `streetName` to the `ShippingAddress` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `wardCode` on the `ShippingAddress` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_userId_fkey";

-- AlterTable
ALTER TABLE "ShippingAddress" DROP COLUMN "cityId",
DROP COLUMN "districtId",
DROP COLUMN "street",
ADD COLUMN     "homeNumber" TEXT NOT NULL,
ADD COLUMN     "moreDetail" TEXT NOT NULL,
ADD COLUMN     "streetName" INTEGER NOT NULL,
DROP COLUMN "wardCode",
ADD COLUMN     "wardCode" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Address";

-- CreateTable
CREATE TABLE "Ward" (
    "wardCode" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "districtCode" INTEGER NOT NULL,

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("wardCode")
);

-- CreateTable
CREATE TABLE "District" (
    "districtCode" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "cityCode" INTEGER NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("districtCode")
);

-- CreateTable
CREATE TABLE "City" (
    "cityCode" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("cityCode")
);

-- AddForeignKey
ALTER TABLE "ShippingAddress" ADD CONSTRAINT "ShippingAddress_wardCode_fkey" FOREIGN KEY ("wardCode") REFERENCES "Ward"("wardCode") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_districtCode_fkey" FOREIGN KEY ("districtCode") REFERENCES "District"("districtCode") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_cityCode_fkey" FOREIGN KEY ("cityCode") REFERENCES "City"("cityCode") ON DELETE CASCADE ON UPDATE CASCADE;
