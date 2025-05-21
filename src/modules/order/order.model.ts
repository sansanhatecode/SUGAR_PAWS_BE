import { OrderStatus } from '@prisma/client';
import { OrderItem } from './order-item/order-item.model';
import { ShippingAddress } from '../address/shipping-address/shipping-address.model';

export class Order {
  id: number;
  userId: number;
  shippingAddressId: number;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  deliveredAt?: Date;
  shippingFee?: number;
  totalAmount: number;
  trackingCode?: string;
  status: OrderStatus;
  payId?: number; // Bỏ paymentMethod, thay bằng liên kết với payment

  shippingAddress?: ShippingAddress;
  orderItems?: OrderItem[];
}
