import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedProducts() {
  await prisma.product.createMany({
    data: [
      {
        name: 'Classic Lolita Dress',
        description: 'A beautiful classic Lolita dress',
        displayImage: ['dress1.jpg'],
      },
      {
        name: 'Gothic Lolita Dress',
        description: 'A stunning gothic Lolita dress',
        displayImage: ['dress2.jpg'],
      },
    ],
  });
}
