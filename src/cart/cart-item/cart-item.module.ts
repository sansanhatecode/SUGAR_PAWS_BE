import { Module } from '@nestjs/common';
import { CartItemController } from './cart-item.controller';
import { CartItemService } from './cart-item.service';
import { PrismaClient } from '@prisma/client';

@Module({
  controllers: [CartItemController],
  providers: [CartItemService, PrismaClient],
  exports: [CartItemService],
})
export class CartItemModule {}
