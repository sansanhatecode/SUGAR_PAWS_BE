import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
  Patch,
  HttpCode,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CartItemService } from './cart-item.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/common/request.types';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart-item')
@UseGuards(JwtAuthGuard)
export class CartItemController {
  constructor(private readonly cartItemService: CartItemService) {}

  @Post()
  async addCartItem(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCartItemDto,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.userId;
    const result = await this.cartItemService.addCartItem(Number(userId), dto);
    res.status(result.statusCode).json(result);
  }

  @Delete(':id')
  async removeCartItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.userId;
    const result = await this.cartItemService.removeCartItem(
      Number(userId),
      Number(id),
    );
    res.status(result.statusCode).json(result);
  }

  @Patch(':id')
  @HttpCode(200)
  async updateCartItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.userId;
    if (dto.quantity === 0) {
      const result = await this.cartItemService.removeCartItem(
        Number(userId),
        Number(id),
      );
      res.status(result.statusCode).json(result);
      return;
    }
    const result = await this.cartItemService.updateCartItem(Number(id), dto);
    res.status(result.statusCode).json(result);
  }
}
