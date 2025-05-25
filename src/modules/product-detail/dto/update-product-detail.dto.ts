import { IsOptional, IsString } from 'class-validator';

export class UpdateProductDetailDto {
  size?: string;
  color?: string;
  stock?: number;
  price?: number;
  discountPercentage?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string; // Will be populated from uploaded file
}
