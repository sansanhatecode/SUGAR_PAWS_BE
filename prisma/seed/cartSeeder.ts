import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCart() {
  const user = await prisma.user.findFirst();
  const productDetails = await prisma.productDetail.findMany();

  if (!user || productDetails.length === 0) return;

  // Kiểm tra xem user đã có cart chưa
  let cart = await prisma.cart.findUnique({
    where: { userId: user.id },
  });

  // Nếu chưa có thì tạo mới
  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId: user.id,
      },
    });
  }
}
