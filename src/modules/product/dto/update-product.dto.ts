import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  displayImage?: string[]; // Array of existing image URLs to keep. New files can be uploaded via 'images' field

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  vendor?: string;

  @IsArray()
  @IsOptional()
  categories?: number[]; // Array of category IDs
}
