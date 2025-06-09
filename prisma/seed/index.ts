import { PrismaClient } from '@prisma/client';
import { seedUsers } from './userSeeder';
import { seedCategories } from './categorySeeder';
import { seedProducts } from './productSeeder';
import { seedCart } from './cartSeeder';
import { seedAddressCodes } from './addressCodeSeeder';

const prisma = new PrismaClient();

async function main() {
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

  console.log('🗑️ Deleting existing data...');

  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.shippingAddress.deleteMany(),
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
  await seedProducts('src/data/flairs_details.json');
  await seedProducts('src/data/shoes_details.json');
  await seedProducts('src/data/shorts_details.json');
  await seedProducts('src/data/bags_details.json');
  await seedProducts('src/data/apron_details.json');
  await seedCart();
  console.log('✅ Seeded Products');
}

main()
  .catch((e) => console.error(e))
  .finally(() => {
    void prisma.$disconnect();
  });
