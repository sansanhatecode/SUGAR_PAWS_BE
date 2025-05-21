export class PaymentModel {
  id: number;
  orderId: number;
  method: string;
  status: string;
  amount: number;
  responseData?: any;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
