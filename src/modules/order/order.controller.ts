import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequestWithUser } from '../address/shipping-address/interfaces/request-with-user.interface';
import type { ApiResponse } from '../../common/response.types';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<OrderResponseDto>> {
    const userId = Number(req && req.user && req.user.userId);
    return await this.orderService.createOrder(userId, createOrderDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getOrders(
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<OrderResponseDto[]>> {
    const userId = Number(req && req.user && req.user.userId);
    return await this.orderService.getOrdersByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('shipping-fee/:addressId')
  async calculateShippingFee(
    @Param('addressId', ParseIntPipe) addressId: number,
  ): Promise<ApiResponse<{ shippingFee: number }>> {
    return await this.orderService.calculateShippingFee(addressId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':orderId')
  async getOrderDetail(
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<ApiResponse<OrderResponseDto | null>> {
    return await this.orderService.getOrderById(orderId);
  }
}
