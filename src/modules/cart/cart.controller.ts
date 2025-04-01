import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/common/request.types';
import { ApiResponse } from '../../common/response.types'; // Import ApiResponse
import { Cart } from './cart.model';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req: AuthenticatedRequest): Promise<ApiResponse<Cart>> {
    const userId = req.user?.userId;
    const response = await this.cartService.getCartByUserId(Number(userId));
    return response;
  }
}
