import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CategoryDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  parentId?: number | null;
}

export class CategoryWithChildrenDto extends CategoryDto {
  @IsArray()
  @IsOptional()
  children?: CategoryWithChildrenDto[];
}

export class CategoryResponseDto {
  success: boolean;
  data?: CategoryDto[];
  message: string;
  error?: string;
}

export class CategoryTreeResponseDto {
  success: boolean;
  data?: CategoryWithChildrenDto[];
  message: string;
  error?: string;
}
