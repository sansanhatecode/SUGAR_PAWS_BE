import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Order } from './order.model';
import { ApiResponse } from 'src/common/response.types';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateOrderDto): Promise<ApiResponse<Order>> {
    try {
      if (!data.userId || !data.shippingAddressId || !data.totalAmount) {
        throw new BadRequestException('Missing required fields');
      }

      const order = await this.prisma.order.create({
        data,
        include: {
          shippingAddress: true,
          orderItems: true,
        },
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Order created successfully',
        data: order,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  async update(id: number, data: UpdateOrderDto): Promise<ApiResponse<Order>> {
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data,
        include: {
          shippingAddress: true,
          orderItems: true,
        },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Order updated successfully',
        data: order,
      };
    } catch (error) {
      console.error(error);
      throw new NotFoundException(
        error instanceof Error ? error.message : 'Order not found',
      );
    }
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    try {
      await this.prisma.order.delete({
        where: { id },
      });
      return {
        statusCode: HttpStatus.OK,
        message: 'Order deleted successfully',
      };
    } catch (error) {
      console.error(error);
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
  }

  async findById(id: number): Promise<ApiResponse<Order>> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          shippingAddress: true,
          orderItems: true,
        },
      });
      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Order fetched successfully',
        data: order,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
}
