import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';

export class ValidateVoucherDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  voucherCode: string;

  @IsNumber()
  @Min(0)
  orderAmount: number;
}
