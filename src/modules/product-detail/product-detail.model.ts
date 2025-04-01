export class ProductDetail {
  id: number;
  productId: number;
  size?: string;
  color?: string;
  stock: number;
  sale: number;
  price: number;
  discountPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}
