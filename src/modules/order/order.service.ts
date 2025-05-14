import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(
    userId: number,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    // Validate productDetailId existence
    const productDetailIds = dto.orderItems.map((item) => item.productDetailId);
    const existingProductDetails = await this.prisma.productDetail.findMany({
      where: { id: { in: productDetailIds } },
      select: { id: true },
    });

    const existingProductDetailIds = new Set(
      existingProductDetails.map((pd) => pd.id),
    );
    const invalidProductDetailIds = productDetailIds.filter(
      (id) => !existingProductDetailIds.has(id),
    );

    if (invalidProductDetailIds.length > 0) {
      throw new Error(
        `Invalid productDetailId(s): ${invalidProductDetailIds.join(', ')}`,
      );
    }

    // Create the order
    const order = await this.prisma.order.create({
      data: {
        userId,
        shippingAddressId: dto.shippingAddressId,
        status: dto.status,
        shippingFee: dto.shippingFee,
        totalAmount: dto.totalAmount,
        trackingCode: dto.trackingCode,
        orderItems: {
          create: dto.orderItems.map((item) => ({
            productDetailId: item.productDetailId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        orderItems: true,
        shippingAddress: true,
      },
    });
    return order as unknown as OrderResponseDto;
  }

  async getOrdersByUser(userId: number): Promise<OrderResponseDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: true,
        shippingAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders as unknown as OrderResponseDto[];
  }
}
