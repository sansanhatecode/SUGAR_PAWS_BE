import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const products = await this.prisma.product.findMany({
        include: {
          productDetails: true,
        },
      });

      return products.map((product) => {
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
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to fetch products');
    }
  }

  async findOne(productId: number) {
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

      return {
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
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to fetch product');
    }
  }

  async findByCategory(categoryName: string, color?: string, size?: string) {
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

    return products;
  }

  async findSizesByCategory(categoryName: string) {
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

      return [...new Set(sizes)];
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to fetch sizes by category',
      );
    }
  }

  async findColorsByCategory(categoryName: string) {
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

      return [...new Set(colors)];
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to fetch colors by category',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  async create(data: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({ data });
      return {
        message: 'Product created successfully',
        product,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  @UseGuards(JwtAuthGuard)
  async update(id: number, data: UpdateProductDto) {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data,
      });
      return {
        message: 'Product updated successfully',
        product,
      };
    } catch (error) {
      console.error(error);
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  @UseGuards(JwtAuthGuard)
  async delete(id: number) {
    try {
      await this.prisma.product.delete({ where: { id } });
      return {
        message: 'Product deleted successfully',
      };
    } catch (error) {
      console.error(error);
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }
}
