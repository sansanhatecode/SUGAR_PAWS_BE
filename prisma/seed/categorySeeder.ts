import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCategories() {
  const categoriesData = [
    {
      name: 'accessories',
      subcategories: [
        'gloves',
        'harnesses and belts',
        'lashes',
        'neckwears',
        'parasols',
        'wristcuffs',
        'bags',
        'pins-and-patches',
        'shoes',
      ],
    },
    {
      name: 'bags',
      subcategories: ['purses', 'totes', 'wallets', 'backpacks'],
    },
    {
      name: 'shoes',
      subcategories: ['flats', 'heels', 'platforms'],
    },
    {
      name: 'pins-and-patches',
      subcategories: ['brooches', 'buttons', 'enamel-pins', 'patches'],
    },
    {
      name: 'hair',
      subcategories: [
        'bows',
        'hair-claws',
        'scrunchies',
        'star-clips',
        'hats',
        'headbands',
      ],
    },
    {
      name: 'clothing',
      subcategories: ['tops', 'dresses', 'bottoms', 'legwears', 'swimwears'],
    },
    {
      name: 'bottoms',
      subcategories: [
        'skirts',
        'petticoats',
        'bloomers',
        'shorts',
        'sweetpants',
      ],
    },
    {
      name: 'tops',
      subcategories: [
        'blouses',
        'button-up-shirts',
        't-shirts',
        'sweaters',
        'cardigans',
      ],
    },
    {
      name: 'dresses',
      subcategories: ['aprons', 'jumperskirts', 'onepieces'],
    },
    {
      name: 'legwears',
      subcategories: ['leggings', 'tights', 'socks'],
    },
    {
      name: 'plus size',
      subcategories: [
        'plus-size-dresses',
        'plus-size-skirts',
        'plus-size-blouses',
        'plus-size-petticoat-bloomers',
        'plus-size-tops',
      ],
    },
    {
      name: 'jewelry',
      subcategories: ['bracelets', 'earrings', 'flairs', 'necklaces', 'rings'],
    },
    {
      name: 'bracelets',
      subcategories: ['bracelets', 'wristcuffs'],
    },
    {
      name: 'earrings',
      subcategories: ['hanging earrings', 'stud earings', 'cup on earings'],
    },
    {
      name: 'flairs',
      subcategories: ['brooches', 'enamel pins', 'buttons', 'rosettes'],
    },
  ];

  console.log('Seeding categories and subcategories...');

  for (const categoryData of categoriesData) {
    let parentCategory = await prisma.category.findUnique({
      where: { name: categoryData.name },
    });

    if (!parentCategory) {
      parentCategory = await prisma.category.create({
        data: { name: categoryData.name },
      });
      console.log(`Created parent category: ${parentCategory.name}`);

      if (categoryData.subcategories.length > 0) {
        // Create subcategories one by one to handle potential naming conflicts
        for (const subcategoryName of categoryData.subcategories) {
          // Check if a category with this name already exists
          const existingCategory = await prisma.category.findUnique({
            where: { name: subcategoryName },
          });

          if (!existingCategory) {
            await prisma.category.create({
              data: {
                name: subcategoryName,
                parentId: parentCategory.id,
              },
            });
            console.log(
              `Created subcategory: ${subcategoryName} for ${parentCategory.name}`,
            );
          } else {
            console.log(
              `Subcategory with name "${subcategoryName}" already exists. Skipping.`,
            );
          }
        }
      }
    } else {
      console.log(
        `Parent category "${parentCategory.name}" already exists. Checking for new subcategories...`,
      );

      if (categoryData.subcategories.length > 0) {
        for (const subcategoryName of categoryData.subcategories) {
          // First check if subcategory with this name exists anywhere
          const existingCategory = await prisma.category.findUnique({
            where: { name: subcategoryName },
          });

          if (!existingCategory) {
            await prisma.category.create({
              data: {
                name: subcategoryName,
                parentId: parentCategory.id,
              },
            });
            console.log(
              `Added new subcategory "${subcategoryName}" to "${parentCategory.name}"`,
            );
          } else {
            // Check if the existing category is already a child of this parent
            const existingSubcategory = await prisma.category.findFirst({
              where: {
                name: subcategoryName,
                parentId: parentCategory.id,
              },
            });

            if (!existingSubcategory) {
              console.log(
                `Category with name "${subcategoryName}" already exists but not as a child of "${parentCategory.name}". Consider using a different name.`,
              );
            } else {
              console.log(
                `Subcategory "${subcategoryName}" already exists under "${parentCategory.name}". Skipping.`,
              );
            }
          }
        }
      }
    }
  }

  console.log('Categories seeding process completed.');
}
