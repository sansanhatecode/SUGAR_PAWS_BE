import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PrismaService } from 'src/prisma.service';
import { ProductDetailModule } from '../product-detail/product-detail.module';
import { CloudinaryModule } from '../cloudinary';

@Module({
  imports: [ProductDetailModule, CloudinaryModule],
  controllers: [ProductController],
  providers: [ProductService, PrismaService],
  exports: [ProductService],
})
export class ProductModule {}
