import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { ProductDetailService } from './product-detail.service';
import { ProductDetailController } from './product-detail.controller';

@Module({
  controllers: [ProductDetailController],
  providers: [ProductDetailService, PrismaService],
  exports: [ProductDetailService],
})
export class ProductDetailModule {}
