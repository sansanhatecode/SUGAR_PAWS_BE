import { PrismaClient } from '@prisma/client';
import { seedUsers } from './userSeeder';
import { seedCategories } from './categorySeeder';
import { seedProducts } from './productSeeder';
import { seedCart } from './cartSeeder';
import { seedAddressCodes } from './addressCodeSeeder';
// import { seedProductDetails } from './productDetailSeeder';
// import { seedProductCategories } from './productCategorySeeder';
// import { seedProductImages } from './productImageSeeder';

const prisma = new PrismaClient();

async function main() {
  // Check if we want to seed only address data
  const seedOption = process.argv[2];

  if (seedOption === 'address-only') {
    console.log('🗑️ Deleting existing address data...');

    await prisma.$transaction([
      prisma.ward.deleteMany(),
      prisma.district.deleteMany(),
      prisma.city.deleteMany(),
    ]);

    console.log('✅ Deleted existing address data');
    console.log('🌱 Seeding address data...');

    await seedAddressCodes();
    console.log('✅ Seeded Address Codes');
    return;
  }

  // Regular full seeding
  console.log('🗑️ Deleting existing data...');

  await prisma.$transaction([
    prisma.cart.deleteMany(),
    prisma.productCategory.deleteMany(),
    prisma.productDetail.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
    prisma.ward.deleteMany(),
    prisma.district.deleteMany(),
    prisma.city.deleteMany(),
  ]);

  console.log('✅ Deleted existing data');

  console.log('🌱 Seeding database...');

  await seedAddressCodes();
  console.log('✅ Seeded Address Codes');

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
