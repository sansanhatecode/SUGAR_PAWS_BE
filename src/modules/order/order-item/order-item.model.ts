import { ProductDetail } from 'src/modules/product-detail/product-detail.model';

export class OrderItem {
  id: number;
  orderId: number;
  productDetailId: number;
  quantity: number;
  price?: number;
  createdAt: Date;
  updatedAt: Date;
  productDetail?: ProductDetail;
}
