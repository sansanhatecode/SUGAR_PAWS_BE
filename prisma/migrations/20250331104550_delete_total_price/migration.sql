/*
  Warnings:

  - You are about to drop the column `totalPrice` on the `Cart` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `totalSale` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `totalStock` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cart" DROP COLUMN "totalPrice";

-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "totalPrice";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "totalPrice";

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "totalPrice";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "totalSale",
DROP COLUMN "totalStock";
