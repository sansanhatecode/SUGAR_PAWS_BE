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
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateOrderDto): Promise<ApiResponse<any>> {
    try {
      if (!data.userId || !data.shippingAddressId || !data.totalAmount) {
        throw new BadRequestException('Missing required fields');
      }

      const { orderItems, ...orderData } = data;
      const order = await this.prisma.order.create({
        data: {
          ...orderData,
          orderItems: {
            create: orderItems,
          },
        },
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

  async update(id: number, data: UpdateOrderDto): Promise<ApiResponse<any>> {
    try {
      const { shippingAddressId, ...restData } = data;

      // Create properly structured update object
      const updateData: any = {
        ...restData,
      };

      // Only add shipping address connection if shippingAddressId is provided
      if (shippingAddressId !== undefined) {
        updateData.shippingAddress = {
          connect: { id: shippingAddressId },
        };
      }

      const order = await this.prisma.order.update({
        where: { id },
        data: updateData,
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

  async findById(id: number): Promise<ApiResponse<any>> {
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

      // Transform null to undefined for paidAt, deliveredAt and paymentMethod to match Order model
      const orderData = {
        ...order,
        paidAt: order.paidAt === null ? undefined : order.paidAt,
        deliveredAt: order.deliveredAt === null ? undefined : order.deliveredAt,
        paymentMethod:
          order.paymentMethod === null ? undefined : order.paymentMethod,
      };

      return {
        statusCode: HttpStatus.OK,
        message: 'Order fetched successfully',
        data: orderData,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
}
