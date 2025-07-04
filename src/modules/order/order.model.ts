import { OrderStatus } from '@prisma/client';
import { OrderItem } from './order-item/order-item.model';
import { ShippingAddress } from '../address/shipping-address/shipping-address.model';

export class Order {
  id: number;
  userId: number;
  username?: string;
  shippingAddressId: number;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  confirmedAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  canceledAt?: Date;
  requestCancelAt?: Date;
  refundedAt?: Date;
  shippingFee?: number;
  totalAmount: number;
  trackingCode?: string;
  status: OrderStatus;
  payId?: number;

  shippingAddress?: ShippingAddress;
  orderItems?: OrderItem[];
}
