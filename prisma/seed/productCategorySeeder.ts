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
    { productId: products[0]?.id, categoryId: categories[0]?.id },
    { productId: products[1]?.id, categoryId: categories[1]?.id },
    { productId: products[1]?.id, categoryId: categories[0]?.id },
    { productId: products[1]?.id, categoryId: categories[0]?.id }, // Duplicate for testing
  ].filter((pc) => pc.productId && pc.categoryId);

  // Loại bỏ các bản ghi trùng lặp dựa trên productId và categoryId
  const uniqueProductCategoriesData = Array.from(
    new Map(
      productCategoriesData.map((item) => [
        `${item.productId}-${item.categoryId}`,
        item,
      ]),
    ).values(),
  );

  if (uniqueProductCategoriesData.length > 0) {
    await prisma.productCategory.createMany({
      data: uniqueProductCategoriesData,
      skipDuplicates: true, // Bỏ qua các bản ghi trùng lặp (chỉ hỗ trợ trên PostgreSQL, MySQL, hoặc SQL Server)
    });
    console.log('✅ Đã seed ProductCategory thành công!');
  } else {
    console.log('⚠️ Không có dữ liệu hợp lệ để seed ProductCategory');
  }
}
