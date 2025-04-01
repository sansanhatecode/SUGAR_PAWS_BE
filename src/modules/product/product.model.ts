import { ProductDetail } from 'src/modules/product-detail/product-detail.model';

export class Product {
  id: number;
  name: string;
  description: string;
  displayImage: string[];
  createdAt: Date;
  updatedAt: Date;
  totalStock?: number;
  totalSales?: number;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  productDetails?: ProductDetail[];
}
