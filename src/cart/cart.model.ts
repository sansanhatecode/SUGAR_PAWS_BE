import { CartItem } from './cart-item/cart-item.model';

export class Cart {
  id: number;
  userId: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  cartItems: CartItem[];
}
