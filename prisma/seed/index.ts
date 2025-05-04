import { PrismaClient } from '@prisma/client';
import { seedUsers } from './userSeeder';
import { seedCategories } from './categorySeeder';
import { seedProducts } from './productSeeder';
import { seedCart } from './cartSeeder';
// import { seedProductDetails } from './productDetailSeeder';
// import { seedProductCategories } from './productCategorySeeder';
// import { seedCart } from './cartSeeder';
// import { seedProductImages } from './productImageSeeder';

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

  await seedProducts('src/data/clothing.json');
  await seedProducts('src/data/hair.json');
  await seedProducts('src/data/jewelry.json');
  await seedProducts('src/data/plus_size.json');
  await seedCart();
  console.log('✅ Seeded Products');

  // await seedCart();
  // console.log('✅ Seeded Cart');

  // console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => console.error(e))
  .finally(() => {
    void prisma.$disconnect();
  });
