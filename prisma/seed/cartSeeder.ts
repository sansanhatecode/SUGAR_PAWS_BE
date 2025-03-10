import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCart() {
  const user = await prisma.user.findFirst();
  const productDetails = await prisma.productDetail.findMany();

  if (!user || productDetails.length === 0) return;

  await prisma.cart.create({
    data: {
      userId: user.id,
      cartItems: {
        create: [
          {
            productDetailId: productDetails[0].id,
            quantity: 2,
            totalPrice: 150.0,
          },
        ],
      },
    },
  });
}
