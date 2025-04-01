import { IsInt, IsPositive } from 'class-validator';

export class CreateCartItemDto {
  @IsInt()
  productDetailId: number;

  @IsInt()
  @IsPositive()
  quantity: number;
}
