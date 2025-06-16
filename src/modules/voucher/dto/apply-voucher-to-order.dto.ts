import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MaxLength,
} from 'class-validator';

export class ApplyVoucherToOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  voucherCode: string;

  @IsOptional()
  @IsNumber()
  orderId?: number;
}
