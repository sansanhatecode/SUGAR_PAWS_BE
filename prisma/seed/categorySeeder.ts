import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCategories() {
  const lolitaDresses = await prisma.category.create({
    data: { name: 'lolita dresses' },
  });

  const accessories = await prisma.category.create({
    data: { name: 'accessories' },
  });

  const shoes = await prisma.category.create({
    data: { name: 'shoes' },
  });

  await prisma.category.createMany({
    data: [
      { name: 'one piece', parentId: lolitaDresses.id },
      { name: 'jumperskirt', parentId: lolitaDresses.id },
      { name: 'blouse', parentId: lolitaDresses.id },
      { name: 'pannier', parentId: accessories.id },
      { name: 'headwear', parentId: accessories.id },
      { name: 'boots', parentId: shoes.id },
      { name: 'mary janes', parentId: shoes.id },
    ],
  });
}
