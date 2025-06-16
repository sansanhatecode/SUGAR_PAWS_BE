import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaService } from '../../prisma.service';
import { PaymentModule } from '../payment/payment.module';
import { VoucherModule } from '../voucher/voucher.module';

@Module({
  imports: [PaymentModule, VoucherModule],
  controllers: [OrderController],
  providers: [OrderService, PrismaService],
})
export class OrderModule {}
