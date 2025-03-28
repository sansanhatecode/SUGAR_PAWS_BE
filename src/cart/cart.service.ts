import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Cart } from './cart.model';
import { ApiResponse } from '../common/response.types'; // Import ApiResponse

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

    if (!cart) {
      throw new NotFoundException('Cart not found for this user');
    }

    return {
      statusCode: 200,
      message: 'Cart retrieved successfully',
      data: cart,
    };
  }
}
