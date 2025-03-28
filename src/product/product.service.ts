import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiResponse } from 'src/common/response.types';
import { Product } from './product.model';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<ApiResponse<any>> {
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
          minPrice: productDetails.length
            ? Math.min(...productDetails.map((detail) => detail.price))
            : 0,
          colors: [...new Set(productDetails.map((detail) => detail.color))],
        };
      });

      return {
        statusCode: 200,
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
        minPrice: product.productDetails.length
          ? Math.min(...product.productDetails.map((detail) => detail.price))
          : 0,
        maxPrice: product.productDetails.length
          ? Math.max(...product.productDetails.map((detail) => detail.price))
          : 0,
        colors: [
          ...new Set(product.productDetails.map((detail) => detail.color)),
        ],
      };

      return {
        statusCode: 200,
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
  ): Promise<ApiResponse<any>> {
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

      let products = category.products.map((p) => p.product);

      if (color) {
        products = products.filter((product) =>
          product.productDetails.some((detail) => detail.color === color),
        );
      }

      if (size) {
        products = products.filter((product) =>
          product.productDetails.some((detail) => detail.size === size),
        );
      }

      const filteredProducts = products;

      return {
        statusCode: 200,
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
        statusCode: 200,
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
        statusCode: 200,
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
        statusCode: 201,
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
        statusCode: 200,
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
        statusCode: 200,
        message: 'Product deleted successfully',
      };
    } catch (error) {
      console.error(error);
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }
}
