import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class CalculateOrderItemDto {
  @IsInt()
  @IsNotEmpty()
  productDetailId: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;
}

export class CalculateOrderTotalDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalculateOrderItemDto)
  @IsNotEmpty()
  orderItems: CalculateOrderItemDto[];

  @IsInt()
  @IsNotEmpty()
  shippingAddressId: number;

  @IsString()
  @IsOptional()
  voucherCode?: string;
}
