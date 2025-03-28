import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedProducts() {
  const productsData = [
    {
      name: 'Sweet Lolita Blouse',
      description: 'A beautiful blouse perfect for sweet lolita outfits.',
      displayImage: ['https://example.com/images/blouse1.jpg'],
      categoryIds: [1, 2], // Giả sử categoryIds là ACCESSORIES và HAIR
    },
    {
      name: 'Classic Lolita Skirt',
      description:
        'Elegant skirt that matches perfectly with any classic lolita outfit.',
      displayImage: ['https://example.com/images/skirt1.jpg'],
      categoryIds: [3], // Giả sử categoryIds là CLOTHING
    },
  ];

  for (const product of productsData) {
    const newProduct = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        displayImage: product.displayImage,
      },
    });

    await prisma.productCategory.createMany({
      data: product.categoryIds.map((categoryId) => ({
        productId: newProduct.id,
        categoryId,
      })),
    });
  }

  console.log('Products seeded successfully!');
}
