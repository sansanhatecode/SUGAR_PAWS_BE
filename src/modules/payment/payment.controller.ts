import {
  Controller,
  Body,
  Param,
  Patch,
  Post,
  Get,
  ParseIntPipe,
} from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async create(
    @Body()
    body: {
      orderId: number;
      method: string;
      status: string;
      amount: number;
      responseData?: any;
      paidAt?: Date;
    },
  ) {
    return this.paymentService.createPayment(body);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: Partial<{
      method: string;
      status: string;
      amount: number;
      responseData: any;
      paidAt: Date;
    }>,
  ) {
    return this.paymentService.updatePayment(id, body);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.getPaymentById(id);
  }
}
