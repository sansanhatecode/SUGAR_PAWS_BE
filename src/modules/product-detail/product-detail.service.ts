import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ProductDetail } from './product-detail.model';
import { CreateProductDetailDto } from './dto/create-product-detail.dto';
import { UpdateProductDetailDto } from './dto/update-product-detail.dto';
import { ApiResponse } from 'src/common/response.types';

@Injectable()
export class ProductDetailService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: CreateProductDetailDto,
  ): Promise<ApiResponse<ProductDetail>> {
    try {
      if (!data.size && !data.color) {
        throw new BadRequestException('Size and color cannot both be null');
      }
      const productDetail = await this.prisma.productDetail.create({ data });
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Product detail created successfully',
        data: {
          ...productDetail,
          size: productDetail.size ?? undefined,
          color: productDetail.color ?? undefined,
        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  async update(
    id: number,
    data: UpdateProductDetailDto,
  ): Promise<ApiResponse<ProductDetail>> {
    try {
      if (!data.size && !data.color) {
        throw new BadRequestException('Size and color cannot both be null');
      }
      const productDetail = await this.prisma.productDetail.update({
        where: { id },
        data,
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Product detail updated successfully',
        data: {
          ...productDetail,
          size: productDetail.size ?? undefined,
          color: productDetail.color ?? undefined,
        },
      };
    } catch (error: unknown) {
      console.error(error);
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    try {
      await this.prisma.productDetail.delete({
        where: { id },
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Product detail deleted successfully',
      };
    } catch (error) {
      console.error(error);
      throw new NotFoundException(`Product detail with ID ${id} not found`);
    }
  }
}
