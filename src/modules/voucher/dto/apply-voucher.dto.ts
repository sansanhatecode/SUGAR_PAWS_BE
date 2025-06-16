import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ApplyVoucherDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  voucherCode: string;
}
