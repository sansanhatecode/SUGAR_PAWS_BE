import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PrismaService } from 'src/prisma.service';
import { ProductDetailModule } from '../product-detail/product-detail.module';

@Module({
  imports: [ProductDetailModule],
  controllers: [ProductController],
  providers: [ProductService, PrismaService],
  exports: [ProductService],
})
export class ProductModule {}
