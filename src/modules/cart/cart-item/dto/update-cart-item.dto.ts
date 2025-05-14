import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsOptional()
  @IsInt()
  newProductDetailId?: number;

  @IsInt()
  @Min(0)
  quantity: number;
}
