import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedProductCategories() {
  const products = await prisma.product.findMany();
  const categories = await prisma.category.findMany();

  if (products.length === 0 || categories.length === 0) {
    console.log('⚠️ Không có sản phẩm hoặc danh mục nào để liên kết!');
    return;
  }

  const productCategoriesData = [
    {
      productId: products[0]?.id,
      categoryId: categories[0]?.id,
    },
    {
      productId: products[1]?.id,
      categoryId: categories[1]?.id,
    },
    {
      productId: products[1]?.id,
      categoryId: categories[0]?.id,
    },
  ].filter((pc) => pc.productId && pc.categoryId);

  if (productCategoriesData.length > 0) {
    await prisma.productCategory.createMany({ data: productCategoriesData });
    console.log('✅ Đã seed ProductCategory thành công!');
  } else {
    console.log('⚠️ Không có dữ liệu hợp lệ để seed ProductCategory');
  }
}
