import { IsOptional, IsString } from 'class-validator';

export class UpdateProductDetailDto {
  size?: string;
  color?: string;
  stock?: number;
  price?: number;
  discountPercentage?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string; // Existing image URL to keep. New file can be uploaded via 'image' field
}
