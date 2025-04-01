import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { CartItem } from './cart-item.model';
import { ApiResponse } from 'src/common/response.types';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const prisma = new PrismaClient();

@Injectable()
export class CartItemService {
  async addCartItem(
    userId: number,
    dto: CreateCartItemDto,
  ): Promise<ApiResponse<CartItem>> {
    try {
      // Kiểm tra xem cart của user có tồn tại không, nếu không thì tạo mới
      let cart = await prisma.cart.findUnique({
        where: { userId },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId },
        });
      }

      // Lấy thông tin productDetail từ database
      const productDetail = await prisma.productDetail.findUnique({
        where: { id: dto.productDetailId },
      });

      if (!productDetail) {
        throw new NotFoundException('ProductDetail not found');
      }

      // Kiểm tra số lượng yêu cầu có vượt quá số lượng hiện có của sản phẩm hay không
      if (dto.quantity > productDetail.stock) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Quantity exceeds available stock',
          error: 'Invalid quantity',
        };
      }
      // Thêm sản phẩm vào giỏ hàng
      const cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productDetailId: dto.productDetailId,
          quantity: dto.quantity,
        },
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'CartItem created successfully',
        data: cartItem,
      };
    } catch (error: unknown) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create CartItem',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async removeCartItem(
    userId: number,
    cartItemId: number,
  ): Promise<ApiResponse<null>> {
    try {
      // Kiểm tra xem cart của user có tồn tại không
      const cart = await prisma.cart.findUnique({
        where: { userId },
      });

      if (!cart) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Cart not found for this user',
          error: 'Not Found',
        };
      }

      // Kiểm tra xem cartItem có thuộc giỏ hàng của người dùng không
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
      });

      if (!cartItem || cartItem.cartId !== cart.id) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: "CartItem not found or does not belong to this user's cart",
          error: 'Not Found',
        };
      }

      // Xóa cartItem
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'CartItem deleted successfully',
      };
    } catch (error: unknown) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete CartItem',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateCartItem(
    cartItemId: number,
    dto: UpdateCartItemDto,
  ): Promise<ApiResponse<any>> {
    try {
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: { productDetail: true },
      });

      if (!cartItem) {
        throw new NotFoundException('CartItem not found');
      }

      const productDetail = await prisma.productDetail.findUnique({
        where: { id: dto.newProductDetailId },
      });

      if (!productDetail) {
        throw new NotFoundException('New ProductDetail not found');
      }

      if (dto.quantity > productDetail.stock) {
        throw new BadRequestException('Quantity exceeds available stock');
      }

      await prisma.cartItem.delete({ where: { id: cartItemId } });

      const newCartItem = await prisma.cartItem.create({
        data: {
          cartId: cartItem.cartId,
          productDetailId: dto.newProductDetailId,
          quantity: dto.quantity,
        },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'CartItem updated successfully',
        data: newCartItem,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update CartItem',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
