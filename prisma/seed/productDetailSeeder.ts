import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedProductDetails() {
  const products = await prisma.product.findMany();

  await prisma.productDetail.createMany({
    data: [
      {
        productId: products[0].id,
        size: 'M',
        color: 'Black',
        stock: 10,
        price: 75.0,
      },
      {
        productId: products[1].id,
        size: 'S',
        color: 'Red',
        stock: 5,
        price: 90.0,
      },
    ],
  });
}
