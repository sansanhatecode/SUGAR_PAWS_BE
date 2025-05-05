/*
  Warnings:

  - You are about to drop the column `unitPrice` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the `_OrderToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_shippingAddressId_fkey";

-- DropForeignKey
ALTER TABLE "_OrderToUser" DROP CONSTRAINT "_OrderToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_OrderToUser" DROP CONSTRAINT "_OrderToUser_B_fkey";

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "unitPrice";

-- DropTable
DROP TABLE "_OrderToUser";

-- CreateTable
CREATE TABLE "ShippingAddress" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" VARCHAR(15) NOT NULL,
    "street" TEXT NOT NULL,
    "wardCode" TEXT NOT NULL,
    "districtId" INTEGER NOT NULL,
    "cityId" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingAddress_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "ShippingAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingAddress" ADD CONSTRAINT "ShippingAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
