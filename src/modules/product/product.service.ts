import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiResponse } from 'src/common/response.types';
import { Product } from './product.model';
import { ProductDetailService } from '../product-detail/product-detail.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private productDetailService: ProductDetailService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async findAll(
    page = 1,
    itemPerPage = 40,
  ): Promise<ApiResponse<{ products: Product[]; totalProducts: number }>> {
    try {
      const skip = (page - 1) * itemPerPage;
      const [products, totalProducts] = await Promise.all([
        this.prisma.product.findMany({
          skip,
          take: itemPerPage,
          include: {
            productDetails: true,
            categories: {
              include: {
                category: true,
              },
            },
          },
        }),
        this.prisma.product.count(),
      ]);

      const formattedProducts = products.map((product) => {
        const productDetails = product.productDetails;
        // Lấy category từ product.categories
        const categories = product.categories?.map((pc) => pc.category) || [];
        return {
          ...product,
          totalStock: productDetails.reduce(
            (sum, detail) => sum + detail.stock,
            0,
          ),
          totalSales: productDetails.reduce(
            (sum, detail) =>
              sum + (Number.isFinite(detail.sale) ? Number(detail.sale) : 0),
            0,
          ),
          maxPrice: productDetails.length
            ? Math.max(...productDetails.map((detail) => detail.price))
            : 0,
          minPrice: productDetails.length
            ? Math.min(...productDetails.map((detail) => detail.price))
            : 0,
          colors: [
            ...new Set(productDetails.map((detail) => detail.color)),
          ].filter((color): color is string => color !== null),
          productDetails: productDetails.map((detail) => ({
            ...detail,
            size: detail.size ?? undefined,
            color: detail.color ?? undefined,
          })),
          categories, // Thêm categories vào kết quả trả về
        };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Products retrieved successfully',
        data: {
          products: formattedProducts,
          totalProducts,
        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to fetch products');
    }
  }

  async findOne(productId: number): Promise<ApiResponse<Product>> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          productDetails: {
            include: {
              image: true,
            },
          },
        },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      const formattedProduct: Product = {
        ...product,
        totalStock: product.productDetails.reduce<number>(
          (sum, detail) => sum + (detail.stock || 0),
          0,
        ),
        totalSales: product.productDetails.reduce<number>(
          (sum, detail) =>
            sum + (Number.isFinite(detail.sale) ? Number(detail.sale) : 0),
          0,
        ),
        minPrice: product.productDetails.length
          ? Math.min(
              ...product.productDetails.map((detail) => detail.price || 0),
            )
          : 0,
        maxPrice: product.productDetails.length
          ? Math.max(
              ...product.productDetails.map((detail) => detail.price || 0),
            )
          : 0,
        colors: [
          ...new Set(
            product.productDetails
              .map((detail) => detail.color)
              .filter(
                (color): color is string =>
                  color !== null && color !== undefined,
              ),
          ),
        ],
        productDetails: product.productDetails.map((detail) => ({
          ...detail,
          size: detail.size ?? undefined,
          color: detail.color ?? undefined,
        })),
      };

      return {
        statusCode: HttpStatus.OK,
        message: 'Product retrieved successfully',
        data: formattedProduct,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to fetch product');
    }
  }

  async findByCategory(
    categoryName: string,
    colors?: string[],
    sizes?: string[],
    availability?: number,
    sortBy?: 'priceAsc' | 'priceDesc' | 'bestSelling',
    priceRange?: { min: number; max: number },
    page = 1,
    itemPerPage = 40,
  ): Promise<ApiResponse<{ products: Product[]; totalProducts: number }>> {
    try {
      const formattedName = categoryName.toLowerCase().replace(/-/g, ' ');
      const category = await this.prisma.category.findUnique({
        where: { name: formattedName },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // Get all child categories recursively
      const getAllChildCategoryIds = async (
        categoryId: number,
      ): Promise<number[]> => {
        const childCategories = await this.prisma.category.findMany({
          where: { parentId: categoryId },
        });

        const childIds = [categoryId];

        for (const child of childCategories) {
          const descendants = await getAllChildCategoryIds(child.id);
          childIds.push(...descendants);
        }

        return childIds;
      };

      // Get all category IDs (parent and all children)
      const categoryIds = await getAllChildCategoryIds(category.id);

      // Fetch all products that belong to any of these categories
      const productsInCategories = await this.prisma.productCategory.findMany({
        where: {
          categoryId: {
            in: categoryIds,
          },
        },
        include: {
          product: {
            include: {
              productDetails: true,
            },
          },
        },
      });

      // Extract unique products
      const productMap = new Map<
        number,
        (typeof productsInCategories)[0]['product']
      >();
      productsInCategories.forEach((pc) => {
        productMap.set(pc.product.id, pc.product);
      });

      const products = Array.from(productMap.values());

      const formattedProducts = products.map((product) => {
        const productDetails = product.productDetails.map((detail) => ({
          ...detail,
          size: detail.size ?? undefined,
        }));

        // Extract all sizes for the product
        const sizes = [
          ...new Set(
            productDetails
              .map((detail) => detail.size)
              .filter(
                (size): size is string => size !== null && size !== undefined,
              ),
          ),
        ];

        const formattedProduct: Product = {
          ...product,
          totalStock: productDetails.reduce(
            (sum, detail) => sum + (detail.stock || 0),
            0,
          ),
          totalSales: productDetails.reduce(
            (sum, detail) =>
              sum + (Number.isFinite(detail.sale) ? Number(detail.sale) : 0),
            0,
          ),
          maxPrice: productDetails.length
            ? Math.max(...productDetails.map((detail) => detail.price || 0))
            : 0,
          minPrice: productDetails.length
            ? Math.min(...productDetails.map((detail) => detail.price || 0))
            : 0,
          colors: [
            ...new Set(productDetails.map((detail) => detail.color)),
          ].filter(
            (color): color is string => color !== null && color !== undefined,
          ),
          sizes: sizes,
          productDetails: product.productDetails.map((detail) => ({
            ...detail,
            size: detail.size ?? undefined,
            color: detail.color ?? undefined,
          })),
        };

        return formattedProduct;
      });

      // Filter products by colors
      let filteredProducts = formattedProducts;

      if (colors && colors.length > 0) {
        filteredProducts = filteredProducts.filter((product) =>
          product.productDetails?.some(
            (detail) => detail.color && colors.includes(detail.color),
          ),
        );
      }

      // Filter products by sizes
      if (sizes && sizes.length > 0) {
        filteredProducts = filteredProducts.filter((product) =>
          product.productDetails?.some(
            (detail) => detail.size && sizes.includes(detail.size),
          ),
        );
      }

      // Filter products by availability
      if (availability !== undefined) {
        filteredProducts = filteredProducts.filter((product) =>
          availability === 1
            ? product.totalStock! > 0
            : product.totalStock === 0,
        );
      }

      if (priceRange) {
        filteredProducts = filteredProducts.filter((product) =>
          product.productDetails?.some(
            (detail) =>
              detail.price >= priceRange.min && detail.price <= priceRange.max,
          ),
        );
      }

      if (sortBy) {
        if (sortBy === 'priceAsc') {
          filteredProducts.sort(
            (a, b) => (a.minPrice || 0) - (b.minPrice || 0),
          );
        } else if (sortBy === 'priceDesc') {
          filteredProducts.sort(
            (a, b) => (b.maxPrice || 0) - (a.maxPrice || 0),
          );
        } else if (sortBy === 'bestSelling') {
          filteredProducts.sort(
            (a, b) => (b.totalSales || 0) - (a.totalSales || 0),
          );
        }
      }

      const totalProducts = filteredProducts.length;
      const paginatedProducts = filteredProducts.slice(
        (page - 1) * itemPerPage,
        page * itemPerPage,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Products by category retrieved successfully',
        data: {
          products: paginatedProducts,
          totalProducts,
        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to fetch products by category',
      );
    }
  }

  async findSizesByCategory(categoryName: string): Promise<ApiResponse<any>> {
    try {
      const formattedName = categoryName.toLowerCase().replace(/-/g, ' ');

      // Get the requested category
      const category = await this.prisma.category.findUnique({
        where: { name: formattedName },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // Get all child categories recursively
      const getAllChildCategoryIds = async (
        categoryId: number,
      ): Promise<number[]> => {
        const childCategories = await this.prisma.category.findMany({
          where: { parentId: categoryId },
        });

        const childIds = [categoryId];

        for (const child of childCategories) {
          const descendants = await getAllChildCategoryIds(child.id);
          childIds.push(...descendants);
        }

        return childIds;
      };

      // Get all category IDs (parent and all children)
      const categoryIds = await getAllChildCategoryIds(category.id);

      // Fetch all products that belong to any of these categories
      const productsInCategories = await this.prisma.productCategory.findMany({
        where: {
          categoryId: {
            in: categoryIds,
          },
        },
        include: {
          product: {
            include: {
              productDetails: true,
            },
          },
        },
      });

      // Extract all sizes from all products in these categories
      const sizes = productsInCategories.flatMap((pc) =>
        pc.product.productDetails.map((detail) => detail.size),
      );

      // Filter out null/undefined values and get unique sizes
      const uniqueSizes = [...new Set(sizes.filter(Boolean))];

      return {
        statusCode: HttpStatus.OK,
        message: 'Sizes by category retrieved successfully',
        data: uniqueSizes,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to fetch sizes by category',
      );
    }
  }

  async findColorsByCategory(categoryName: string): Promise<ApiResponse<any>> {
    try {
      const formattedName = categoryName.toLowerCase().replace(/-/g, ' ');

      // Get the requested category
      const category = await this.prisma.category.findUnique({
        where: { name: formattedName },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // Get all child categories recursively
      const getAllChildCategoryIds = async (
        categoryId: number,
      ): Promise<number[]> => {
        const childCategories = await this.prisma.category.findMany({
          where: { parentId: categoryId },
        });

        const childIds = [categoryId];

        for (const child of childCategories) {
          const descendants = await getAllChildCategoryIds(child.id);
          childIds.push(...descendants);
        }

        return childIds;
      };

      // Get all category IDs (parent and all children)
      const categoryIds = await getAllChildCategoryIds(category.id);

      // Fetch all products that belong to any of these categories
      const productsInCategories = await this.prisma.productCategory.findMany({
        where: {
          categoryId: {
            in: categoryIds,
          },
        },
        include: {
          product: {
            include: {
              productDetails: true,
            },
          },
        },
      });

      // Extract all colors from all products in these categories
      const colors = productsInCategories.flatMap((pc) =>
        pc.product.productDetails.map((detail) => detail.color),
      );

      // Filter out null/undefined values and get unique colors
      const uniqueColors = [...new Set(colors.filter(Boolean))];

      return {
        statusCode: HttpStatus.OK,
        message: 'Colors by category retrieved successfully',
        data: uniqueColors,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to fetch colors by category',
      );
    }
  }

  async create(
    data: CreateProductDto,
    imageFiles?: Express.Multer.File[],
  ): Promise<ApiResponse<any>> {
    try {
      const { categories, ...productData } = data;

      // Upload images to Cloudinary if provided
      let displayImageUrls: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        const uploadPromises = imageFiles.map((file) =>
          this.cloudinaryService.uploadImage(file),
        );
        displayImageUrls = await Promise.all(uploadPromises);
      }

      // Add uploaded image URLs to product data
      const productWithImages = {
        ...productData,
        displayImage: displayImageUrls,
      };

      // Validate categories
      if (categories && categories.length > 0) {
        const validCategories = await this.prisma.category.findMany({
          where: { id: { in: categories } },
          select: { id: true },
        });
        const validCategoryIds = validCategories.map((category) => category.id);

        // Check for invalid category IDs
        const invalidCategoryIds = categories.filter(
          (id) => !validCategoryIds.includes(id),
        );
        if (invalidCategoryIds.length > 0) {
          throw new BadRequestException(
            `Invalid category IDs: ${invalidCategoryIds.join(', ')}`,
          );
        }
      }

      // Create product
      const product = await this.prisma.product.create({
        data: productWithImages,
      });

      // Create ProductCategory relations
      if (categories && categories.length > 0) {
        await Promise.all(
          categories.map((categoryId) =>
            this.prisma.productCategory.create({
              data: { productId: product.id, categoryId },
            }),
          ),
        );
      }

      // Fetch product with categories for response
      const productWithCategories = await this.prisma.product.findUnique({
        where: { id: product.id },
        include: { categories: { include: { category: true } } },
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Product created successfully',
        data: productWithCategories,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  async update(
    id: number,
    data: UpdateProductDto,
    imageFiles?: Express.Multer.File[],
  ): Promise<ApiResponse<any>> {
    try {
      // Extract categories from data
      const { categories, ...productData } = data;

      // Get current product to preserve existing images
      const currentProduct = await this.prisma.product.findUnique({
        where: { id },
        select: { displayImage: true },
      });

      if (!currentProduct) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      // Handle image updates
      let finalDisplayImages: string[] = [];

      // Start with existing images (if preserving them)
      if (productData.displayImage) {
        // Filter and keep only valid existing URLs
        const existingValidImages = productData.displayImage.filter(
          (url: string) => {
            return typeof url === 'string' && /^(http|https):\/\//.test(url);
          },
        );
        finalDisplayImages = [...existingValidImages];
      } else {
        // If no displayImage field provided, preserve all current images
        finalDisplayImages = [...(currentProduct.displayImage || [])];
      }

      // Upload new images if provided
      if (imageFiles && imageFiles.length > 0) {
        const uploadPromises = imageFiles.map((file) =>
          this.cloudinaryService.uploadImage(file),
        );
        const newImageUrls = await Promise.all(uploadPromises);
        finalDisplayImages = [...finalDisplayImages, ...newImageUrls];
      }

      // Remove duplicates and limit to reasonable number
      finalDisplayImages = [...new Set(finalDisplayImages)].slice(0, 10);

      // Update product data with final image array
      const updateData = {
        ...productData,
        displayImage: finalDisplayImages,
      };

      // Update product
      await this.prisma.product.update({
        where: { id },
        data: updateData,
      });

      if (categories) {
        await this.prisma.productCategory.deleteMany({
          where: { productId: id },
        });
        await Promise.all(
          categories.map((categoryId) =>
            this.prisma.productCategory.create({
              data: { productId: id, categoryId },
            }),
          ),
        );
      }

      // Fetch product with categories for response
      const productWithCategories = await this.prisma.product.findUnique({
        where: { id },
        include: { categories: { include: { category: true } } },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Product updated successfully',
        data: productWithCategories,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  async delete(id: number): Promise<ApiResponse<any>> {
    try {
      await this.prisma.product.delete({ where: { id } });
      return {
        statusCode: HttpStatus.OK,
        message: 'Product deleted successfully',
      };
    } catch (error) {
      console.error(error);
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async deleteMany(productIds: number[]): Promise<ApiResponse<any>> {
    try {
      const existingProducts = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      });

      const existingProductIds = existingProducts.map((p) => p.id);
      const nonExistingIds = productIds.filter(
        (id) => !existingProductIds.includes(id),
      );

      if (nonExistingIds.length > 0) {
        throw new NotFoundException(
          `Products with IDs [${nonExistingIds.join(', ')}] not found`,
        );
      }

      const productDetailsCount = await this.prisma.productDetail.count({
        where: { productId: { in: productIds } },
      });

      const deleteResult = await this.prisma.product.deleteMany({
        where: { id: { in: productIds } },
      });

      return {
        statusCode: HttpStatus.OK,
        message: `Successfully deleted ${deleteResult.count} products and ${productDetailsCount} related product details`,
        data: {
          deletedProductsCount: deleteResult.count,
          deletedProductDetailsCount: productDetailsCount,
          deletedProducts: existingProducts.map((p) => ({
            id: p.id,
            name: p.name,
          })),
        },
      };
    } catch (error) {
      console.error('Delete many products error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete products');
    }
  }

  async getProductNameByProductDetailId(
    productDetailId: number,
  ): Promise<ApiResponse<string>> {
    try {
      const response =
        await this.productDetailService.findById(productDetailId);
      const productDetail = response.data;
      if (!productDetail) {
        throw new NotFoundException(
          `ProductDetail with ID ${productDetailId} not found`,
        );
      }
      const product = await this.prisma.product.findUnique({
        where: { id: productDetail.productId },
        select: { name: true },
      });
      if (!product) {
        throw new NotFoundException(
          `Product with ID ${productDetail.productId} not found`,
        );
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'Product name retrieved successfully',
        data: product.name,
      };
    } catch (error) {
      console.error(error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch product name');
    }
  }

  async findRelatedProducts(
    productId: number,
  ): Promise<ApiResponse<Product[]>> {
    try {
      // Lấy sản phẩm gốc và tags
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { tags: true },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }
      const tags = product.tags || [];
      if (tags.length === 0) {
        return {
          statusCode: HttpStatus.OK,
          message: 'No related products found',
          data: [],
        };
      }
      const relatedProducts = await this.prisma.product.findMany({
        where: {
          id: { not: productId },
          tags: {
            hasSome: tags,
          },
        },
        include: {
          productDetails: true,
        },
      });
      // Sắp xếp theo số lượng tag trùng giảm dần, lấy tối đa 5 sản phẩm
      const sortedRelated = relatedProducts
        .map((p) => ({
          product: p,
          sameTagCount: p.tags.filter((tag) => tags.includes(tag)).length,
        }))
        .sort((a, b) => b.sameTagCount - a.sameTagCount)
        .slice(0, 5)
        .map((item) => {
          const productDetails = item.product.productDetails;
          return {
            ...item.product,
            totalStock: productDetails.reduce(
              (sum, detail) => sum + (detail.stock || 0),
              0,
            ),
            totalSales: productDetails.reduce(
              (sum, detail) =>
                sum + (Number.isFinite(detail.sale) ? Number(detail.sale) : 0),
              0,
            ),
            maxPrice: productDetails.length
              ? Math.max(...productDetails.map((detail) => detail.price || 0))
              : 0,
            minPrice: productDetails.length
              ? Math.min(...productDetails.map((detail) => detail.price || 0))
              : 0,
            colors: [
              ...new Set(productDetails.map((detail) => detail.color)),
            ].filter(
              (color): color is string => color !== null && color !== undefined,
            ),
            productDetails: productDetails.map((detail) => ({
              ...detail,
              size: detail.size ?? undefined,
              color: detail.color ?? undefined,
            })),
          };
        });
      return {
        statusCode: HttpStatus.OK,
        message: 'Related products retrieved successfully',
        data: sortedRelated,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to fetch related products',
      );
    }
  }
}
