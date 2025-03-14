import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCategories() {
  const categoriesData = [
    {
      name: 'ABOUT',
      subcategories: [
        'about us',
        'retail location',
        "faq's",
        'event calendar',
        'event booking',
      ],
    },
    {
      name: 'ACCESSORIES',
      subcategories: [
        'gloves',
        'harnesses and belts',
        'lashes',
        'neckwear',
        'parasols',
        'wristcuffs',
        'bags',
        'pins and patches',
        'shoes',
      ],
    },
    {
      name: 'HAIR',
      subcategories: ['bows', 'hair claws', 'scrunchies', 'star clips', 'hats'],
    },
    {
      name: 'CLOTHING',
      subcategories: [
        'blouses',
        'jumperskirts',
        'onepieces',
        'skirts',
        'pants',
      ],
    },
    {
      name: 'JEWELRY',
      subcategories: ['bracelets', 'earrings', 'flairs', 'necklaces', 'rings'],
    },
    {
      name: 'PLUS SIZE',
      subcategories: [
        'plus size dresses',
        'plus size skirts',
        'plus size blouses',
        'plus size petticoat & bloomers',
      ],
    },
  ];

  for (const category of categoriesData) {
    const parent = await prisma.category.create({
      data: { name: category.name },
    });

    await prisma.category.createMany({
      data: category.subcategories.map((sub) => ({
        name: sub,
        parentId: parent.id,
      })),
    });
  }

  console.log('Categories seeded successfully!');
}
