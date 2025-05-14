import { Module } from '@nestjs/common';
import { ShippingAddressController } from './shipping-address.controller';
import { ShippingAddressService } from './shipping-address.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [ShippingAddressController],
  providers: [ShippingAddressService, PrismaService],
  exports: [ShippingAddressService],
})
export class ShippingAddressModule {}
