import { PrismaClient } from '@prisma/client';
import { seedUsers } from './userSeeder';
import { seedCategories } from './categorySeeder';
import { seedProducts } from './productSeeder';
import { seedProductDetails } from './productDetailSeeder';
import { seedProductCategories } from './productCategorySeeder';
import { seedCart } from './cartSeeder';
import { seedProductImages } from './productImageSeeder';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Deleting existing data...');

  await prisma.$transaction([
    prisma.cart.deleteMany(),
    prisma.productCategory.deleteMany(),
    prisma.productDetail.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('✅ Deleted existing data');

  console.log('🌱 Seeding database...');

  await seedUsers();
  console.log('✅ Seeded Users');

  await seedCategories();
  console.log('✅ Seeded Categories');

  await seedProducts();
  console.log('✅ Seeded Products');

  await seedProductImages();
  console.log('✅ Seeded Product Images');

  await seedProductDetails();
  console.log('✅ Seeded Product Details');

  await seedProductCategories();
  console.log('✅ Seeded Product Categories');

  await seedCart();
  console.log('✅ Seeded Cart');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => {
    void prisma.$disconnect();
  });
