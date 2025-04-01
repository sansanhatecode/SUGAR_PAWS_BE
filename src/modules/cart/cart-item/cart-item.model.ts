import { ProductDetail } from 'src/modules/product-detail/product-detail.model';

export class CartItem {
  id: number;
  cartId: number;
  productDetailId: number;
  quantity: number;
  totalPrice?: number;
  createdAt: Date;
  updatedAt: Date;
  productDetail?: ProductDetail;
}
