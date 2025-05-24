import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Cart } from './cart.model';
import { ApiResponse } from '../../common/response.types';
import { ProductService } from '../product/product.service'; // Import ProductService

const prisma = new PrismaClient();

@Injectable()
export class CartService {
  constructor(private readonly productService: ProductService) {}

  async getCartByUserId(userId: number): Promise<ApiResponse<Cart>> {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        cartItems: {
          include: {
            productDetail: {
              include: {
                image: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found for this user');
    }

    const cartItemsWithProductNames = await Promise.all(
      cart.cartItems.map(async (item) => {
        // Get product name using ProductService
        const productNameResponse =
          await this.productService.getProductNameByProductDetailId(
            item.productDetailId,
          );

        // Get displayImage using Prisma (fetch product by productId)
        let displayImage: string[] | undefined = undefined;
        if (item.productDetail?.productId) {
          const product = await prisma.product.findUnique({
            where: { id: item.productDetail.productId },
            select: { displayImage: true },
          });
          displayImage = product?.displayImage;
        }

        return {
          ...item,
          totalPrice: item.quantity * item.productDetail.price,
          productDetail: {
            ...item.productDetail,
            name: productNameResponse.data,
            size: item.productDetail.size ?? undefined,
            color: item.productDetail.color ?? undefined,
            imageId: item.productDetail.imageId ?? undefined,
            image: item.productDetail.image ?? undefined,
            displayImage,
          },
        };
      }),
    );

    cartItemsWithProductNames.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    const formatedCart: Cart = {
      ...cart,
      totalPrice: cart.cartItems.reduce(
        (total, item) => total + item.quantity * item.productDetail.price,
        0,
      ),
      cartItems: cartItemsWithProductNames,
    };

    return {
      statusCode: 200,
      message: 'Cart retrieved successfully',
      data: formatedCart,
    };
  }
}
