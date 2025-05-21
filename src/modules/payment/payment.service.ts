import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async createPayment(data: {
    orderId: number;
    method: string;
    status: string;
    amount: number;
    responseData?: any;
    paidAt?: Date;
  }) {
    return this.prisma.payment.create({ data });
  }

  async updatePayment(
    id: number,
    data: Partial<{
      method: string;
      status: string;
      amount: number;
      responseData: any;
      paidAt: Date;
    }>,
  ) {
    return this.prisma.payment.update({ where: { id }, data });
  }

  async getPaymentById(id: number) {
    return this.prisma.payment.findUnique({ where: { id } });
  }
}
