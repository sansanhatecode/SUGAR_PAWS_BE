import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  displayImage: string[];

  @IsArray()
  tags: string[];

  @IsString()
  @IsNotEmpty()
  vendor: string;

  @IsArray()
  categories: number[]; // Array of category IDs
}
