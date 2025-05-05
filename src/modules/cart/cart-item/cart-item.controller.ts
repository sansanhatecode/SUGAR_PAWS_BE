import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartItemService } from './cart-item.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { CartItem } from './cart-item.model';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/common/request.types';
import { ApiResponse } from 'src/common/response.types';

@Controller('cart-item')
@UseGuards(JwtAuthGuard)
export class CartItemController {
  constructor(private readonly cartItemService: CartItemService) {}

  @Post()
  async addCartItem(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCartItemDto,
  ): Promise<ApiResponse<CartItem>> {
    const userId = req.user?.userId;
    return this.cartItemService.addCartItem(Number(userId), dto);
  }

  @Delete(':id')
  async removeCartItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ApiResponse<null>> {
    const userId = req.user?.userId;
    return this.cartItemService.removeCartItem(Number(userId), Number(id));
  }
}
