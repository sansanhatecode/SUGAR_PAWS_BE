import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpException,
  InternalServerErrorException,
  UseGuards,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiResponse } from 'src/common/response.types';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(): Promise<ApiResponse<any>> {
    try {
      return await this.productService.findAll();
    } catch (error: unknown) {
      console.error('[ProductController] FindAll error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve products');
    }
  }

  @Get('category')
  async findByCategory(
    @Query('category') categoryName?: string,
    @Query('colors') colors?: string[],
    @Query('sizes') sizes?: string[],
    @Query('sortBy') sortBy?: 'priceAsc' | 'priceDesc' | 'bestSelling',
    @Query('avaiability') avaiability?: number,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ): Promise<ApiResponse<any>> {
    try {
      if (!categoryName) {
        throw new BadRequestException('Category is required');
      }
      const priceRange = {
        min: minPrice ?? 0,
        max: maxPrice ?? Number.MAX_VALUE,
      };
      return await this.productService.findByCategory(
        categoryName,
        colors,
        sizes,
        avaiability,
        sortBy,
        priceRange,
      );
    } catch (error: unknown) {
      console.error('[ProductController] FindByCategory error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve products by category',
      );
    }
  }

  @Get('colors')
  async findColorsByCategory(
    @Query('category') categoryName?: string,
  ): Promise<ApiResponse<any>> {
    try {
      if (!categoryName) {
        throw new BadRequestException('Category is required');
      }

      return await this.productService.findColorsByCategory(categoryName);
    } catch (error: unknown) {
      console.error('[ProductController] FindColorsByCategory error:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve colors by category',
      );
    }
  }

  @Get('sizes')
  async findSizesByCategory(
    @Query('category') categoryName: string,
  ): Promise<ApiResponse<any>> {
    try {
      const data = await this.productService.findSizesByCategory(categoryName);
      return data;
    } catch (error: unknown) {
      console.error('[ProductController] FindSizesByCategory error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve sizes by category',
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    try {
      return await this.productService.findOne(Number(id));
    } catch (error: unknown) {
      console.error('[ProductController] FindOne error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve product');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ApiResponse<any>> {
    try {
      return await this.productService.create(createProductDto);
    } catch (error: unknown) {
      console.error('[ProductController] Create error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ApiResponse<any>> {
    try {
      return await this.productService.update(Number(id), updateProductDto);
    } catch (error: unknown) {
      console.error('[ProductController] Update error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<ApiResponse<any>> {
    try {
      return await this.productService.delete(Number(id));
    } catch (error: unknown) {
      console.error('[ProductController] Delete error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete product');
    }
  }
}
