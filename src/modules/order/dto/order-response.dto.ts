import { OrderItem } from '../order-item/order-item.model';
import { Order } from '../order.model';

export class OrderResponseDto implements Order {
  id: number;
  userId: number;
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
  paymentMethod?: string;
  shippingFee?: number;
  totalAmount: number;
  trackingCode?: string;
  status: any;
  shippingAddress?: any;
  orderItems?: OrderItem[];
  payId?: number;
}
