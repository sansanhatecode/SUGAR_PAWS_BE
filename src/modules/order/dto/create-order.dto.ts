import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
  ValidateNested,
  IsString,
} from 'class-validator';

class CreateOrderItemDto {
  @IsInt()
  @IsNotEmpty()
  productDetailId: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;
}

export class CreateOrderDto {
  @IsInt()
  @IsNotEmpty()
  shippingAddressId: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // Bắt buộc: 'COD' hoặc 'ONLINE'

  @IsString()
  @IsOptional()
  trackingCode?: string;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus = OrderStatus.PENDING;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsNotEmpty()
  orderItems: CreateOrderItemDto[];
}
