import { IsInt, IsPositive } from 'class-validator';

export class UpdateCartItemDto {
  @IsInt()
  newProductDetailId: number;

  @IsInt()
  @IsPositive()
  quantity: number;
}
