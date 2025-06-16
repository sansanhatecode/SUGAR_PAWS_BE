import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { PaymentService } from '../payment/payment.service';
import { VoucherService } from '../voucher/voucher.service';
import { ApiResponse } from '../../common/response.types';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly voucherService: VoucherService,
  ) {}

  // Calculate shipping fee based on the shipping address
  async calculateShippingFee(
    shippingAddressId: number,
  ): Promise<ApiResponse<{ shippingFee: number }>> {
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

      return {
        statusCode: 200,
        message: 'Shipping fee calculated successfully',
        data: { shippingFee: baseFee },
      };
    } catch (error) {
      console.error('Error calculating shipping fee:', error);
      return {
        statusCode: 500,
        message: 'Error calculating shipping fee',
        error:
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof (error as { message?: unknown }).message === 'string'
            ? (error as { message: string }).message
            : 'Unknown error',
        data: { shippingFee: 30000 }, // Default shipping fee in case of error
      };
    }
  }

  // Tách logic tính toán tiền đơn hàng thành hàm riêng
  private calculateOrderAmounts(
    totalProduct: number,
    shippingFee: number,
    voucher?: {
      type: string;
      discountType: string;
      discountValue: number;
      maxDiscountAmount?: number | null;
    },
  ): {
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
  } {
    const originalAmount = totalProduct + shippingFee;
    let discountAmount = 0;

    if (voucher) {
      if (voucher.type === 'DISCOUNT') {
        // Voucher giảm giá chỉ áp dụng trên tiền product, không tính phí ship
        if (voucher.discountType === 'PERCENTAGE') {
          discountAmount = (totalProduct * voucher.discountValue) / 100;
          // Áp dụng giới hạn giảm giá tối đa nếu có
          if (
            voucher.maxDiscountAmount &&
            discountAmount > voucher.maxDiscountAmount
          ) {
            discountAmount = voucher.maxDiscountAmount;
          }
        } else if (voucher.discountType === 'FIXED_AMOUNT') {
          // Đảm bảo không giảm quá tiền product
          discountAmount = Math.min(voucher.discountValue, totalProduct);
        }
      } else if (voucher.type === 'SHIPPING') {
        // Voucher giảm phí vận chuyển - chỉ áp dụng lên phí ship
        if (voucher.discountType === 'PERCENTAGE') {
          discountAmount = (shippingFee * voucher.discountValue) / 100;
          // Áp dụng giới hạn giảm giá tối đa nếu có
          if (
            voucher.maxDiscountAmount &&
            discountAmount > voucher.maxDiscountAmount
          ) {
            discountAmount = voucher.maxDiscountAmount;
          }
        } else if (voucher.discountType === 'FIXED_AMOUNT') {
          // Đảm bảo không giảm quá phí ship
          discountAmount = Math.min(voucher.discountValue, shippingFee);
        }
      }
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);

    return {
      originalAmount,
      discountAmount,
      finalAmount,
    };
  }

  async createOrder(
    userId: number,
    dto: CreateOrderDto,
  ): Promise<ApiResponse<OrderResponseDto>> {
    // Validate productDetailId existence
    const productDetailIds = dto.orderItems.map((item) => item.productDetailId);
    const existingProductDetails = await this.prisma.productDetail.findMany({
      where: { id: { in: productDetailIds } },
      select: { id: true, price: true },
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

    // Calculate shipping fee
    const shippingFeeResponse = await this.calculateShippingFee(
      dto.shippingAddressId,
    );
    const shippingFee = shippingFeeResponse.data?.shippingFee ?? 0;

    // Calculate total product amount (actual price calculation)
    const totalProduct = dto.orderItems.reduce((sum, item) => {
      const productDetail = existingProductDetails.find(
        (pd) => pd.id === item.productDetailId,
      );
      const price = productDetail?.price ?? 0;
      return sum + price * item.quantity;
    }, 0);

    let voucherId: number | undefined;
    let voucherInfo: {
      id: number;
      code: string;
      name: string;
      type: string;
      discountType: string;
      discountValue: number;
    } | null = null;
    let voucherData:
      | {
          type: string;
          discountType: string;
          discountValue: number;
          maxDiscountAmount?: number | null;
        }
      | undefined;

    // Apply voucher if provided
    if (dto.voucherCode) {
      try {
        // Validate voucher - cần truyền đúng giá trị để validate
        const voucherValidation = await this.voucherService.validateVoucher(
          dto.voucherCode,
          userId,
          totalProduct + shippingFee, // Tổng đơn hàng cho validation
          shippingFee,
        );

        if (voucherValidation.isValid) {
          // Get voucher details for discount calculation
          const voucher = await this.prisma.voucher.findUnique({
            where: { code: dto.voucherCode },
          });

          if (voucher) {
            voucherId = voucher.id;
            voucherInfo = {
              id: voucher.id,
              code: voucher.code,
              name: voucher.name,
              type: voucher.type,
              discountType: voucher.discountType,
              discountValue: voucher.discountValue,
            };
            voucherData = {
              type: voucher.type,
              discountType: voucher.discountType,
              discountValue: voucher.discountValue,
              maxDiscountAmount: voucher.maxDiscountAmount,
            };
          }
        }
      } catch (error) {
        console.warn('Voucher validation failed:', error);
        // Continue without voucher if validation fails
      }
    }

    // Tính toán số tiền sử dụng hàm mới
    const { originalAmount, discountAmount, finalAmount } =
      this.calculateOrderAmounts(totalProduct, shippingFee, voucherData);

    // Create order
    const order = await this.prisma.order.create({
      data: {
        userId,
        shippingAddressId: dto.shippingAddressId,
        status: dto.status,
        shippingFee,
        trackingCode: dto.trackingCode,
        voucherId,
        orderItems: {
          create: dto.orderItems.map((item) => ({
            productDetailId: item.productDetailId,
            quantity: item.quantity,
          })),
        },
      },
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
        voucher: true,
      },
    });

    // Create payment with final amount
    await this.paymentService.createPayment({
      orderId: order.id,
      method: dto.paymentMethod,
      status: 'UNPAID',
      amount: finalAmount,
    });

    // Apply voucher (update usage count and create UserVoucher record)
    if (dto.voucherCode && voucherId) {
      try {
        await this.voucherService.applyVoucher(
          dto.voucherCode,
          userId,
          order.id,
        );
      } catch (error) {
        console.warn('Failed to apply voucher after order creation:', error);
      }
    }

    // Remove ordered items from cart
    await this.prisma.cartItem.deleteMany({
      where: {
        cart: { userId },
        productDetailId: { in: productDetailIds },
      },
    });

    // Get payment information
    const payment = await this.prisma.payment.findFirst({
      where: { orderId: order.id },
    });

    // Format response with voucher information
    const responseData: OrderResponseDto = {
      ...order,
      payment,
      totalAmount: finalAmount,
      originalAmount,
      discountAmount,
      voucher: voucherInfo,
    } as unknown as OrderResponseDto;

    return {
      statusCode: 201,
      message: 'Order created successfully',
      data: responseData,
    };
  }

  async getOrdersByUser(
    userId: number,
  ): Promise<ApiResponse<OrderResponseDto[]>> {
    // Lấy tất cả đơn hàng của user, bao gồm orderItems và productDetail cho từng orderItem, payment, và voucher
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
        payment: true,
        voucher: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            discountType: true,
            discountValue: true,
            maxDiscountAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Tính tổng tiền hàng + phí ship cho từng đơn hàng và thông tin voucher
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

      // Calculate discount if voucher is applied using the new function
      const voucherData = order.voucher
        ? {
            type: order.voucher.type,
            discountType: order.voucher.discountType,
            discountValue: order.voucher.discountValue,
            maxDiscountAmount: order.voucher.maxDiscountAmount,
          }
        : undefined;

      const { originalAmount, discountAmount, finalAmount } =
        this.calculateOrderAmounts(totalProduct, shippingFee, voucherData);

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
        totalAmount: finalAmount,
        originalAmount,
        discountAmount,
        orderItems: formattedOrderItems,
      };
    });
    return {
      statusCode: 200,
      message: 'Orders fetched successfully',
      data: ordersWithTotal as unknown as OrderResponseDto[],
    };
  }

  async getAllOrders(): Promise<ApiResponse<OrderResponseDto[]>> {
    const orders = await this.prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
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
        payment: true,
        voucher: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            discountType: true,
            discountValue: true,
            maxDiscountAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

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

      // Calculate discount if voucher is applied using the new function
      const voucherData = order.voucher
        ? {
            type: order.voucher.type,
            discountType: order.voucher.discountType,
            discountValue: order.voucher.discountValue,
            maxDiscountAmount: order.voucher.maxDiscountAmount,
          }
        : undefined;

      const { originalAmount, discountAmount, finalAmount } =
        this.calculateOrderAmounts(totalProduct, shippingFee, voucherData);

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
        totalAmount: finalAmount,
        originalAmount,
        discountAmount,
        orderItems: formattedOrderItems,
        userName: order.user?.name || null,
        phoneNumber: order.shippingAddress?.phoneNumber || null,
      };
    });
    return {
      statusCode: 200,
      message: 'All orders fetched successfully',
      data: ordersWithTotal as unknown as OrderResponseDto[],
    };
  }

  async getOrderById(
    orderId: number,
  ): Promise<ApiResponse<OrderResponseDto | null>> {
    // Lấy order theo id, bao gồm orderItems, productDetail, payment, và voucher
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            productDetail: {
              include: {
                image: true,
                product: {
                  select: {
                    id: true,
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
        payment: true,
        voucher: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            discountType: true,
            discountValue: true,
            maxDiscountAmount: true,
          },
        },
      },
    });
    if (!order) {
      return {
        statusCode: 404,
        message: 'Order not found',
        data: null,
      };
    }
    // Tổng tiền hàng = tổng (giá * số lượng) của từng orderItem
    const totalProduct = order.orderItems.reduce((sum, item) => {
      const price =
        item.productDetail && typeof item.productDetail.price === 'number'
          ? item.productDetail.price
          : 0;
      return sum + price * item.quantity;
    }, 0);
    const shippingFee = order.shippingFee ?? 0;

    // Calculate discount if voucher is applied using the new function
    const voucherData = order.voucher
      ? {
          type: order.voucher.type,
          discountType: order.voucher.discountType,
          discountValue: order.voucher.discountValue,
          maxDiscountAmount: order.voucher.maxDiscountAmount,
        }
      : undefined;

    const { originalAmount, discountAmount, finalAmount } =
      this.calculateOrderAmounts(totalProduct, shippingFee, voucherData);

    // Format lại orderItems để trả về imageUrl, product name, displayImage
    const formattedOrderItems = order.orderItems.map((item) => ({
      ...item,
      productDetail: {
        ...item.productDetail,
        productName: item.productDetail.product?.name || null,
        productDisplayImage: item.productDetail.product?.displayImage || null,
      },
    }));

    return {
      statusCode: 200,
      message: 'Order fetched successfully',
      data: {
        ...order,
        totalAmount: finalAmount,
        originalAmount,
        discountAmount,
        orderItems: formattedOrderItems,
      } as unknown as OrderResponseDto,
    };
  }

  async updateOrder(
    id: number,
    dto: UpdateOrderDto,
  ): Promise<ApiResponse<OrderResponseDto>> {
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: {
          userId: dto.userId,
          shippingAddressId: dto.shippingAddressId,
          paidAt: dto.paidAt,
          confirmedAt: dto.confirmedAt,
          deliveredAt: dto.deliveredAt,
          completedAt: dto.completedAt,
          canceledAt: dto.canceledAt,
          requestCancelAt: dto.requestCancelAt,
          refundedAt: dto.refundedAt,
          shippingFee: dto.shippingFee,
          trackingCode: dto.trackingCode,
          status: dto.status,
        },
        include: {
          orderItems: {
            include: {
              productDetail: {
                include: {
                  image: true,
                  product: {
                    select: {
                      id: true,
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
          payment: true,
        },
      });
      const totalProduct =
        order.orderItems && Array.isArray(order.orderItems)
          ? order.orderItems.reduce((sum, item) => {
              const price =
                item.productDetail &&
                typeof item.productDetail.price === 'number'
                  ? item.productDetail.price
                  : 0;
              return sum + price * item.quantity;
            }, 0)
          : 0;
      const shippingFee = order.shippingFee ?? 0;
      const formattedOrderItems =
        order.orderItems && Array.isArray(order.orderItems)
          ? order.orderItems.map((item) => ({
              ...item,
              productDetail: {
                ...item.productDetail,
                productName: item.productDetail.product?.name || null,
                productDisplayImage:
                  item.productDetail.product?.displayImage || null,
              },
            }))
          : [];
      return {
        statusCode: 200,
        message: 'Order updated successfully',
        data: {
          ...order,
          totalAmount: totalProduct + shippingFee,
          orderItems: formattedOrderItems,
        } as unknown as OrderResponseDto,
      };
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        message: 'Failed to update order',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: undefined,
      };
    }
  }

  async updateOrderStatus(
    id: number,
    newStatus: OrderStatus,
  ): Promise<ApiResponse<OrderResponseDto>> {
    try {
      const currentOrder = await this.prisma.order.findUnique({
        where: { id },
      });

      if (!currentOrder) {
        return {
          statusCode: 404,
          message: 'Order not found',
          data: undefined,
        };
      }
      interface OrderUpdateData {
        status: OrderStatus;
        confirmedAt?: Date;
        deliveredAt?: Date;
        completedAt?: Date;
        canceledAt?: Date;
        requestCancelAt?: Date;
        refundedAt?: Date;
      }
      const updateData: OrderUpdateData = {
        status: newStatus,
      };
      switch (newStatus) {
        case 'CONFIRMED':
          updateData.confirmedAt = new Date();
          break;
        case 'DELIVERED':
          updateData.deliveredAt = new Date();
          break;
        case 'COMPLETED':
          updateData.completedAt = new Date();
          break;
        case 'CANCELLED':
          updateData.canceledAt = new Date();
          break;
        case 'REQUESTCANCEL':
          updateData.requestCancelAt = new Date();
          break;
        case 'REFUNDED':
          updateData.refundedAt = new Date();
          break;
      }

      const order = await this.prisma.order.update({
        where: { id },
        data: updateData,
        include: {
          orderItems: {
            include: {
              productDetail: {
                include: {
                  image: true,
                  product: {
                    select: {
                      id: true,
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
          payment: true,
        },
      });

      const totalProduct =
        order.orderItems && Array.isArray(order.orderItems)
          ? order.orderItems.reduce((sum, item) => {
              const price =
                item.productDetail &&
                typeof item.productDetail.price === 'number'
                  ? item.productDetail.price
                  : 0;
              return sum + price * item.quantity;
            }, 0)
          : 0;
      const shippingFee = order.shippingFee ?? 0;

      const formattedOrderItems =
        order.orderItems && Array.isArray(order.orderItems)
          ? order.orderItems.map((item) => ({
              ...item,
              productDetail: {
                ...item.productDetail,
                productName: item.productDetail.product?.name || null,
                productDisplayImage:
                  item.productDetail.product?.displayImage || null,
              },
            }))
          : [];

      return {
        statusCode: 200,
        message: `Order status updated to ${newStatus} successfully`,
        data: {
          ...order,
          totalAmount: totalProduct + shippingFee,
          orderItems: formattedOrderItems,
        } as unknown as OrderResponseDto,
      };
    } catch (error) {
      console.error('Error updating order status:', error);
      return {
        statusCode: 500,
        message: 'Failed to update order status',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: undefined,
      };
    }
  }

  async calculateOrderTotal(
    userId: number,
    dto: {
      orderItems: { productDetailId: number; quantity: number }[];
      shippingAddressId: number;
      voucherCode?: string;
    },
  ): Promise<
    ApiResponse<{
      totalProduct: number;
      shippingFee: number;
      originalAmount: number;
      discountAmount: number;
      finalAmount: number;
      voucher?: {
        id: number;
        code: string;
        name: string;
        discountType: string;
        discountValue: number;
      };
    }>
  > {
    try {
      // Validate productDetailId existence
      const productDetailIds = dto.orderItems.map(
        (item) => item.productDetailId,
      );
      const existingProductDetails = await this.prisma.productDetail.findMany({
        where: { id: { in: productDetailIds } },
        select: { id: true, price: true },
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

      // Calculate shipping fee
      const shippingFeeResponse = await this.calculateShippingFee(
        dto.shippingAddressId,
      );
      const shippingFee = shippingFeeResponse.data?.shippingFee ?? 0;

      // Calculate total product amount
      const totalProduct = dto.orderItems.reduce((sum, item) => {
        const productDetail = existingProductDetails.find(
          (pd) => pd.id === item.productDetailId,
        );
        const price = productDetail?.price ?? 0;
        return sum + price * item.quantity;
      }, 0);

      let voucherData:
        | {
            type: string;
            discountType: string;
            discountValue: number;
            maxDiscountAmount?: number | null;
          }
        | undefined;

      // Apply voucher if provided
      if (dto.voucherCode) {
        try {
          // Validate voucher - cần truyền đúng giá trị để validate
          const voucherValidation = await this.voucherService.validateVoucher(
            dto.voucherCode,
            userId,
            totalProduct + shippingFee, // Tổng đơn hàng cho validation
            shippingFee,
          );

          if (voucherValidation.isValid) {
            // Get voucher details
            const voucher = await this.prisma.voucher.findUnique({
              where: { code: dto.voucherCode },
            });

            if (voucher) {
              voucherData = {
                type: voucher.type,
                discountType: voucher.discountType,
                discountValue: voucher.discountValue,
                maxDiscountAmount: voucher.maxDiscountAmount,
              };
            }
          }
        } catch (error) {
          console.warn('Voucher validation failed:', error);
          // Continue without voucher if validation fails
        }
      }

      // Tính toán số tiền sử dụng hàm mới
      const { originalAmount, discountAmount, finalAmount } =
        this.calculateOrderAmounts(totalProduct, shippingFee, voucherData);

      const voucherInfo = voucherData
        ? {
            id: 0, // Will be set properly when voucher is found
            code: dto.voucherCode || '',
            name: '',
            discountType: voucherData.discountType,
            discountValue: voucherData.discountValue,
          }
        : undefined;

      return {
        statusCode: 200,
        message: 'Order total calculated successfully',
        data: {
          totalProduct,
          shippingFee,
          originalAmount,
          discountAmount,
          finalAmount,
          voucher: voucherInfo,
        },
      };
    } catch (error) {
      return {
        statusCode: 400,
        message: 'Failed to calculate order total',
        error:
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof (error as { message?: unknown }).message === 'string'
            ? (error as { message: string }).message
            : 'Unknown error',
        data: {
          totalProduct: 0,
          shippingFee: 0,
          originalAmount: 0,
          discountAmount: 0,
          finalAmount: 0,
        },
      };
    }
  }
}
