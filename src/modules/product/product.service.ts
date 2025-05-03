import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiResponse } from 'src/common/response.types';
import { Product } from './product.model';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<ApiResponse<Product[]>> {
    try {
      const products = await this.prisma.product.findMany({
        include: {
          productDetails: true,
        },
      });

      const formattedProducts = products.map((product) => {
        const productDetails = product.productDetails;

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
        };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Products retrieved successfully',
        data: formattedProducts,
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
          productDetails: true,
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
    color?: string,
    size?: string,
    availability?: number,
    sortBy?: 'priceAsc' | 'priceDesc' | 'bestSelling',
    priceRange?: { min: number; max: number },
  ): Promise<ApiResponse<Product[]>> {
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
          sizes: sizes, // Add sizes array to each product
          productDetails: product.productDetails.map((detail) => ({
            ...detail,
            size: detail.size ?? undefined,
            color: detail.color ?? undefined,
          })),
        };

        return formattedProduct;
      });

      // Filter products by color
      let filteredProducts = formattedProducts;

      if (color) {
        filteredProducts = filteredProducts.filter((product) =>
          product.productDetails?.some((detail) => detail.color === color),
        );
      }

      // Filter products by size
      if (size) {
        filteredProducts = filteredProducts.filter((product) =>
          product.productDetails?.some((detail) => detail.size === size),
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
      return {
        statusCode: HttpStatus.OK,
        message: 'Products by category retrieved successfully',
        data: filteredProducts,
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

  async create(data: CreateProductDto): Promise<ApiResponse<any>> {
    try {
      const product = await this.prisma.product.create({ data });
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Product created successfully',
        data: product,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  async update(id: number, data: UpdateProductDto): Promise<ApiResponse<any>> {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Product updated successfully',
        data: product,
      };
    } catch (error) {
      console.error(error);
      throw new NotFoundException(`Product with ID ${id} not found`);
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
}
