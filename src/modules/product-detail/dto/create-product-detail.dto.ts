import { IsOptional, IsString } from 'class-validator';

export class CreateProductDetailDto {
  productId: number;
  size?: string;
  color?: string;
  stock: number;
  price: number;
  discountPercentage?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string; // Existing image URL. New file can be uploaded via 'image' field
}
