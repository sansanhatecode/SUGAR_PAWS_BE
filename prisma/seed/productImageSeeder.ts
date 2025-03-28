import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedProductImages() {
  const imagesData = [
    { url: 'https://example.com/images/red_blouse.jpg' },
    { url: 'https://example.com/images/blue_blouse.jpg' },
    { url: 'https://example.com/images/pink_skirt.jpg' },
  ];

  await prisma.productImage.createMany({
    data: imagesData,
  });

  console.log('ProductImages seeded successfully!');
}
