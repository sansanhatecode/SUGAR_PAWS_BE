import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedProductDetails() {
  const productDetailsData = [
    {
      productId: 1,
      size: 'XS',
      color: 'Red',
      stock: 20,
      sale: 0, // Default value for sale
      price: 49.99,
      discountPercentage: 10.0, // Ensure it's a float
      imageId: 1,
    },
    {
      productId: 1,
      size: 'L',
      color: 'Red',
      stock: 15,
      sale: 0, // Default value for sale
      price: 49.99,
      discountPercentage: 10.0,
      imageId: 1,
    },
    {
      productId: 1,
      size: 'M',
      color: 'Blue',
      stock: 10,
      sale: 0, // Default value for sale
      price: 54.99,
      discountPercentage: 0.0, // Ensure it's a float
      imageId: 2,
    },
    {
      productId: 2,
      size: 'S',
      color: 'Pink',
      stock: 12,
      sale: 5, // Default value for sale
      price: 39.99,
      discountPercentage: 5.0, // Ensure it's a float
      imageId: 3,
    },
  ];

  await prisma.productDetail.createMany({
    data: productDetailsData,
  });

  console.log('ProductDetails seeded successfully!');
}
