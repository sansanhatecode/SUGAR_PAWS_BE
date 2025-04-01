import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Cart } from './cart.model';
import { ApiResponse } from '../../common/response.types'; // Import ApiResponse

const prisma = new PrismaClient();

@Injectable()
export class CartService {
  async getCartByUserId(userId: number): Promise<ApiResponse<Cart>> {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        cartItems: {
          include: {
            productDetail: true,
          },
        },
      },
    });

    const formatedCart: Cart | undefined = cart
      ? {
          ...cart,
          totalPrice: cart.cartItems.reduce(
            (total, item) => total + item.quantity * item.productDetail.price,
            0,
          ),
          cartItems: cart.cartItems.map((item) => ({
            ...item,
            totalPrice: item.quantity * item.productDetail.price,
            productDetail: {
              ...item.productDetail,
              size: item.productDetail.size ?? undefined,
              color: item.productDetail.color ?? undefined,
            },
          })),
        }
      : undefined;

    if (!cart) {
      throw new NotFoundException('Cart not found for this user');
    }

    return {
      statusCode: 200,
      message: 'Cart retrieved successfully',
      data: formatedCart,
    };
  }
}
