export class CreateProductDto {
  name: string;
  description: string;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  displayImage: string[];
}
