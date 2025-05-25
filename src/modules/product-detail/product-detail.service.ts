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
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProductDetailService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    data: CreateProductDetailDto,
    imageFile?: Express.Multer.File,
  ): Promise<ApiResponse<ProductDetail>> {
    try {
      if (!data.size && !data.color) {
        throw new BadRequestException('Size and color cannot both be null');
      }

      let imageId: number | null = null;

      // Handle image upload if provided
      if (imageFile) {
        const imageUrl = await this.cloudinaryService.uploadImage(imageFile);

        // Create or find existing ProductImage
        const productImage = await this.prisma.productImage.upsert({
          where: { url: imageUrl },
          create: { url: imageUrl },
          update: {},
        });

        imageId = productImage.id;
      } else if (data.imageUrl) {
        // If imageUrl is provided, create/find ProductImage
        const productImage = await this.prisma.productImage.upsert({
          where: { url: data.imageUrl },
          create: { url: data.imageUrl },
          update: {},
        });

        imageId = productImage.id;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { imageUrl, ...productDetailData } = data;
      const finalData = {
        ...productDetailData,
        imageId,
      };

      const productDetail = await this.prisma.productDetail.create({
        data: finalData,
        include: { image: true },
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Product detail created successfully',
        data: {
          ...productDetail,
          size: productDetail.size ?? undefined,
          color: productDetail.color ?? undefined,
          imageUrl: productDetail.image?.url,
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
    imageFile?: Express.Multer.File,
  ): Promise<ApiResponse<ProductDetail>> {
    try {
      if (!data.size && !data.color) {
        throw new BadRequestException('Size and color cannot both be null');
      }

      // Get current product detail to preserve existing image if needed
      const currentProductDetail = await this.prisma.productDetail.findUnique({
        where: { id },
        select: { imageId: true },
      });

      if (!currentProductDetail) {
        throw new NotFoundException(`Product detail with ID ${id} not found`);
      }

      let imageId: number | null = currentProductDetail.imageId;

      // Handle image upload
      if (imageFile) {
        // Upload new image
        const imageUrl = await this.cloudinaryService.uploadImage(imageFile);

        // Create or find existing ProductImage
        const productImage = await this.prisma.productImage.upsert({
          where: { url: imageUrl },
          create: { url: imageUrl },
          update: {},
        });

        imageId = productImage.id;
      } else if (data.imageUrl) {
        // If imageUrl is provided, create/find ProductImage
        const productImage = await this.prisma.productImage.upsert({
          where: { url: data.imageUrl },
          create: { url: data.imageUrl },
          update: {},
        });

        imageId = productImage.id;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { imageUrl: _imageUrl, ...updateData } = data;
      const finalUpdateData = {
        ...updateData,
        imageId,
      };

      const productDetail = await this.prisma.productDetail.update({
        where: { id },
        data: finalUpdateData,
        include: { image: true },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Product detail updated successfully',
        data: {
          ...productDetail,
          size: productDetail.size ?? undefined,
          color: productDetail.color ?? undefined,
          imageUrl: productDetail.image?.url,
        },
      };
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
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

  async findById(id: number): Promise<ApiResponse<ProductDetail>> {
    try {
      const productDetail = await this.prisma.productDetail.findUnique({
        where: { id },
      });

      if (!productDetail) {
        throw new NotFoundException(`Product detail with ID ${id} not found`);
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Product detail retrieved successfully',
        data: {
          ...productDetail,
          size: productDetail.size ?? undefined,
          color: productDetail.color ?? undefined,
        },
      };
    } catch (error) {
      console.error(error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
}
