import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { PaymentService } from '../payment/payment.service';
import { ApiResponse } from '../../common/response.types';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  // Calculate shipping fee based on the shipping address
  async calculateShippingFee(shippingAddressId: number): Promise<number> {
    try {
      // Get the shipping address
      const shippingAddress = await this.prisma.shippingAddress.findUnique({
        where: { id: shippingAddressId },
        include: {
          ward: {
            include: {
              district: {
                include: {
                  city: true,
                },
              },
            },
          },
        },
      });

      if (!shippingAddress) {
        throw new Error(
          `Shipping address with ID ${shippingAddressId} not found`,
        );
      }

      // For a real implementation, we would call Viettel Post API here
      // but for now, we'll use a simple location-based calculation algorithm

      // Calculate base fee - determine if the address is in Hanoi
      const cityName = shippingAddress.ward.district.city.name.toLowerCase();
      const isHanoi = cityName.includes('hà nội');

      // Base fee: 20k VND for Hanoi, 35k VND for other provinces
      let baseFee = isHanoi ? 20000 : 35000;

      // Apply distance-based adjustment
      if (!isHanoi) {
        // Northern provinces (closer to Hanoi)
        if (
          ['hải phòng', 'hải dương', 'hưng yên', 'bắc ninh', 'vĩnh phúc'].some(
            (name) => cityName.includes(name),
          )
        ) {
          baseFee += 5000;
        }
        // Central provinces
        else if (
          ['đà nẵng', 'huế', 'quảng nam', 'quảng ngãi'].some((name) =>
            cityName.includes(name),
          )
        ) {
          baseFee += 20000;
        }
        // Southern provinces
        else if (
          ['hồ chí minh', 'cần thơ', 'bình dương', 'đồng nai'].some((name) =>
            cityName.includes(name),
          )
        ) {
          baseFee += 30000;
        }
        // Default case for other provinces
        else {
          baseFee += 15000;
        }
      }

      return baseFee;
    } catch (error) {
      console.error('Error calculating shipping fee:', error);
      return 30000; // Default shipping fee in case of error
    }
  }

  async createOrder(
    userId: number,
    dto: CreateOrderDto,
  ): Promise<ApiResponse<OrderResponseDto>> {
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

    // Calculate shipping fee if not provided
    const shippingFee = await this.calculateShippingFee(dto.shippingAddressId);

    // Tính tổng tiền hàng (cần truy vấn giá thực tế, ở đây chỉ demo = 0)
    const totalProduct = 0;
    const totalAmount = totalProduct + shippingFee;

    // 1. Tạo order trước (chưa có payment)
    const order = await this.prisma.order.create({
      data: {
        userId,
        shippingAddressId: dto.shippingAddressId,
        status: dto.status,
        shippingFee,
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

    // 2. Tạo payment với orderId vừa tạo
    await this.paymentService.createPayment({
      orderId: order.id,
      method: dto.paymentMethod,
      status: 'UNPAID',
      amount: totalAmount,
    });

    // Xóa các sản phẩm đã đặt khỏi giỏ hàng của user
    await this.prisma.cartItem.deleteMany({
      where: {
        cart: { userId },
        productDetailId: { in: productDetailIds },
      },
    });

    // 3. Lấy payment vừa tạo
    const payment = await this.prisma.payment.findFirst({
      where: { orderId: order.id },
    });

    // 4. Trả về order kèm payment
    return {
      statusCode: 201,
      message: 'Order created successfully',
      data: {
        ...order,
        payment,
      } as unknown as OrderResponseDto,
    };
  }

  async getOrdersByUser(
    userId: number,
  ): Promise<ApiResponse<OrderResponseDto[]>> {
    // Lấy tất cả đơn hàng của user, bao gồm orderItems và productDetail cho từng orderItem, và payment
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            productDetail: {
              include: {
                image: true,
                product: {
                  select: {
                    name: true,
                    displayImage: true,
                    vendor: true,
                  },
                },
              },
            },
          },
        },
        shippingAddress: true,
        payment: true, // Thêm payment
      },
      orderBy: { createdAt: 'desc' },
    });

    // Tính tổng tiền hàng + phí ship cho từng đơn hàng
    const ordersWithTotal = orders.map((order) => {
      // Tổng tiền hàng = tổng (giá * số lượng) của từng orderItem
      const totalProduct = order.orderItems.reduce((sum, item) => {
        const price =
          item.productDetail && typeof item.productDetail.price === 'number'
            ? item.productDetail.price
            : 0;
        return sum + price * item.quantity;
      }, 0);
      const shippingFee = order.shippingFee ?? 0;
      // Format lại orderItems để trả về imageUrl, product name, displayImage
      const formattedOrderItems = order.orderItems.map((item) => ({
        ...item,
        productDetail: {
          ...item.productDetail,
          imageUrl: item.productDetail.image?.url || null,
          productName: item.productDetail.product?.name || null,
          productDisplayImage: item.productDetail.product?.displayImage || null,
        },
      }));
      return {
        ...order,
        totalAmount: totalProduct + shippingFee,
        orderItems: formattedOrderItems,
      };
    });
    return {
      statusCode: 200,
      message: 'Orders fetched successfully',
      data: ordersWithTotal as unknown as OrderResponseDto[],
    };
  }

  async getOrderById(
    orderId: number,
  ): Promise<ApiResponse<OrderResponseDto | null>> {
    // Lấy order theo id, bao gồm orderItems, productDetail, và payment
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { include: { productDetail: true } },
        payment: true,
      },
    });
    return {
      statusCode: 200,
      message: 'Order fetched successfully',
      data: order as unknown as OrderResponseDto,
    };
  }
}
