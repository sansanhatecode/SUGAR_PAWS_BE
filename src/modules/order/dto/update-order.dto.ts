import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class UpdateOrderItemDto {
  @IsInt()
  @IsOptional()
  id?: number;

  @IsInt()
  @IsOptional()
  productDetailId?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;
}

export class UpdateOrderDto {
  @IsInt()
  @IsOptional()
  userId?: number;

  @IsInt()
  @IsOptional()
  shippingAddressId?: number;

  @IsDate()
  @IsOptional()
  paidAt?: Date;

  @IsDate()
  @IsOptional()
  deliveredAt?: Date;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsNumber()
  @IsOptional()
  shippingFee?: number;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsString()
  @IsOptional()
  trackingCode?: string;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  @IsOptional()
  orderItems?: UpdateOrderItemDto[];
}
