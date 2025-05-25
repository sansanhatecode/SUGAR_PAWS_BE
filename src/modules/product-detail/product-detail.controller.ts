import {
  Controller,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductDetailService } from './product-detail.service';
import { CreateProductDetailDto } from './dto/create-product-detail.dto';
import { UpdateProductDetailDto } from './dto/update-product-detail.dto';

@Controller('product-detail')
export class ProductDetailController {
  constructor(private readonly productDetailService: ProductDetailService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createProductDetailDto: CreateProductDetailDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productDetailService.create(createProductDetailDto, file);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDetailDto: UpdateProductDetailDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productDetailService.update(id, updateProductDetailDto, file);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.productDetailService.delete(id);
  }
}
