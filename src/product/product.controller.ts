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
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll() {
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

  @Get('/:categoryname')
  async findByCategory(@Param('categoryname') categoryName: string) {
    try {
      return await this.productService.findByCategory(categoryName);
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

  @Get(':id')
  async findOne(@Param('id') id: string) {
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
  async create(@Body() createProductDto: CreateProductDto) {
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
  ) {
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
  async delete(@Param('id') id: string) {
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
