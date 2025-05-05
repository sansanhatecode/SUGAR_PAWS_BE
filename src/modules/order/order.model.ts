import { Address, OrderStatus } from '@prisma/client';
import { OrderItem } from './order-item/order-item.model';

export class Order {
  id: number;
  userId: number;
  shippingAddressId: number;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  deliveredAt?: Date;
  paymentMethod?: string;
  shippingFee?: number;
  totalAmount: number;
  trackingCode?: string;
  status: OrderStatus;

  shippingAddress?: Address;
  orderItems?: OrderItem[];
}
