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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { DeleteManyProductsDto } from './dto/delete-many-products.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiResponse } from 'src/common/response.types';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('itemPerPage') itemPerPage?: number,
  ): Promise<ApiResponse<any>> {
    try {
      return await this.productService.findAll(
        page ? Number(page) : 1,
        itemPerPage ? Number(itemPerPage) : 40,
      );
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
    @Query('page') page?: number,
    @Query('itemPerPage') itemPerPage?: number,
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
        page ? Number(page) : 1,
        itemPerPage ? Number(itemPerPage) : 40,
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

  @Get('search')
  async searchByName(
    @Query('name') searchTerm: string,
    @Query('page') page?: number,
    @Query('itemPerPage') itemPerPage?: number,
  ): Promise<ApiResponse<any>> {
    try {
      if (!searchTerm) {
        throw new BadRequestException('Search term is required');
      }
      return await this.productService.searchByName(
        searchTerm,
        page ? Number(page) : 1,
        itemPerPage ? Number(itemPerPage) : 40,
      );
    } catch (error: unknown) {
      console.error('[ProductController] SearchByName error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to search products');
    }
  }

  @Get(':id/related')
  async findRelatedProducts(
    @Param('id') id: string,
  ): Promise<ApiResponse<any>> {
    try {
      return await this.productService.findRelatedProducts(Number(id));
    } catch (error: unknown) {
      console.error('[ProductController] FindRelatedProducts error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve related products',
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
  @UseInterceptors(FilesInterceptor('images', 20)) // Maximum 10 files
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ApiResponse<any>> {
    try {
      // Ensure categories are properly converted to numbers
      if (createProductDto.categories) {
        createProductDto.categories = createProductDto.categories.map((id) =>
          typeof id === 'string' ? parseInt(id, 10) : id,
        );
      }
      return await this.productService.create(createProductDto, files);
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
  @UseInterceptors(FilesInterceptor('images', 20)) // Maximum 10 files
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<ApiResponse<any>> {
    try {
      // Ensure categories are properly converted to numbers
      if (updateProductDto.categories) {
        updateProductDto.categories = updateProductDto.categories.map((id) =>
          typeof id === 'string' ? parseInt(id, 10) : id,
        );
      }
      return await this.productService.update(
        Number(id),
        updateProductDto,
        files,
      );
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

  @UseGuards(JwtAuthGuard)
  @Delete()
  async deleteMany(
    @Body() deleteManyDto: DeleteManyProductsDto,
  ): Promise<ApiResponse<any>> {
    try {
      return await this.productService.deleteMany(deleteManyDto.productIds);
    } catch (error: unknown) {
      console.error('[ProductController] DeleteMany error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete products');
    }
  }
}
