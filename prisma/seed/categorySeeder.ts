import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCategories() {
  await prisma.category.createMany({
    data: [
      { name: 'Lolita Dresses' },
      { name: 'Accessories' },
      { name: 'Shoes' },
    ],
  });
}
