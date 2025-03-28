import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedProductDetails() {
  const productDetailsData = [
    {
      productId: 1, // ID của Sweet Lolita Blouse
      size: 'XS',
      color: 'Red',
      stock: 20,
      price: 49.99,
      discountPercentage: 10,
      imageId: 1, // Liên kết với hình ảnh red_blouse.jpg
    },
    {
      productId: 1,
      size: 'L',
      color: 'Red',
      stock: 15,
      price: 49.99,
      discountPercentage: 10,
      imageId: 1, // Cùng ảnh với XS, màu đỏ
    },
    {
      productId: 1,
      size: 'M',
      color: 'Blue',
      stock: 10,
      price: 54.99,
      discountPercentage: 0,
      imageId: 2, // Liên kết với hình ảnh blue_blouse.jpg
    },
    {
      productId: 2, // ID của Classic Lolita Skirt
      size: 'S',
      color: 'Pink',
      stock: 12,
      price: 39.99,
      discountPercentage: 5,
      imageId: 3, // Liên kết với hình ảnh pink_skirt.jpg
    },
  ];

  await prisma.productDetail.createMany({
    data: productDetailsData,
  });

  console.log('ProductDetails seeded successfully!');
}
