import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedProducts() {
  await prisma.product.createMany({
    data: [
      {
        name: 'Classic Lolita Dress',
        description: 'A beautiful classic Lolita dress',
        minPrice: 50.0,
        maxPrice: 100.0,
        displayImage: ['dress1.jpg'],
      },
      {
        name: 'Gothic Lolita Dress',
        description: 'A stunning gothic Lolita dress',
        minPrice: 60.0,
        maxPrice: 120.0,
        displayImage: ['dress2.jpg'],
      },
    ],
  });
}
