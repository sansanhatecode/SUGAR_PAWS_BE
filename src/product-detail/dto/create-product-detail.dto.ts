export class CreateProductDetailDto {
  productId: number;
  size?: string;
  color?: string;
  stock: number;
  price: number;
  discountPercentage?: number;
}
