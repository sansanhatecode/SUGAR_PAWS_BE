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
        totalStock: product.productDetails.reduce(
          (sum, detail) => sum + detail.stock,
          0,
        ),
        totalSales: product.productDetails.reduce(
          (sum, detail) =>
            sum + (Number.isFinite(detail.sale) ? (detail.sale as number) : 0),
          0,
        ),
        minPrice: product.productDetails.length
          ? Math.min(...product.productDetails.map((detail) => detail.price))
          : 0,
        maxPrice: product.productDetails.length
          ? Math.max(...product.productDetails.map((detail) => detail.price))
          : 0,
        colors: [
          ...new Set(
            product.productDetails
              .map((detail) => detail.color)
              .filter((color): color is string => color !== null),
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
      const category = await this.prisma.category.findUnique({
        where: { name: categoryName },
        include: {
          products: {
            include: {
              product: {
                include: {
                  productDetails: true,
                },
              },
            },
          },
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const products = category.products.map((p) => p.product);

      const formattedProducts = products.map((product) => {
        const productDetails = product.productDetails.map((detail) => ({
          ...detail,
          size: detail.size ?? undefined,
        }));

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
          productDetails: product.productDetails.map((detail) => ({
            ...detail,
            size: detail.size ?? undefined,
            color: detail.color ?? undefined,
          })),
        };
      });

      // Filter products by color
      let filteredProducts = formattedProducts;

      if (color) {
        filteredProducts = filteredProducts.filter((product) =>
          product.productDetails.some((detail) => detail.color === color),
        );
      }

      // Filter products by size
      if (size) {
        filteredProducts = filteredProducts.filter((product) =>
          product.productDetails.some((detail) => detail.size === size),
        );
      }

      // Filter products by availability
      if (availability !== undefined) {
        filteredProducts = filteredProducts.filter((product) =>
          availability === 1
            ? product.totalStock > 0
            : product.totalStock === 0,
        );
      }

      if (priceRange) {
        filteredProducts = filteredProducts.filter((product) =>
          product.productDetails.some(
            (detail) =>
              detail.price >= priceRange.min && detail.price <= priceRange.max,
          ),
        );
      }

      if (sortBy) {
        if (sortBy === 'priceAsc') {
          filteredProducts.sort((a, b) => a.minPrice - b.minPrice);
        } else if (sortBy === 'priceDesc') {
          filteredProducts.sort((a, b) => b.maxPrice - a.maxPrice);
        } else if (sortBy === 'bestSelling') {
          filteredProducts.sort((a, b) => b.totalSales - a.totalSales);
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

      const category = await this.prisma.category.findUnique({
        where: { name: formattedName },
        include: {
          products: {
            include: {
              product: {
                include: {
                  productDetails: true,
                },
              },
            },
          },
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const sizes = category.products.flatMap((p) =>
        p.product.productDetails.map((detail) => detail.size),
      );

      const uniqueSizes = [...new Set(sizes)];

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

      const category = await this.prisma.category.findUnique({
        where: { name: formattedName },
        include: {
          products: {
            include: {
              product: {
                include: {
                  productDetails: true,
                },
              },
            },
          },
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const colors = category.products.flatMap((p) =>
        p.product.productDetails.map((detail) => detail.color),
      );

      const uniqueColors = [...new Set(colors)];

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
