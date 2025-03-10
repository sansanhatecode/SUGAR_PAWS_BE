import { PrismaClient } from '@prisma/client';
import { seedUsers } from './userSeeder';
import { seedCategories } from './categorySeeder';
import { seedProducts } from './productSeeder';
import { seedProductDetails } from './productDetailSeeder';
import { seedCart } from './cartSeeder';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await seedUsers();
  console.log('✅ Seeded Users');

  await seedCategories();
  console.log('✅ Seeded Categories');

  await seedProducts();
  console.log('✅ Seeded Products');

  await seedProductDetails();
  console.log('✅ Seeded Product Details');

  await seedCart();
  console.log('✅ Seeded Cart');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => console.error(e))
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(async () => {
    await prisma.$disconnect();
  });
