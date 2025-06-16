import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { ApplyVoucherToOrderDto } from './dto/apply-voucher-to-order.dto';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';
import { VoucherResponseDto } from './dto/voucher-response.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RoleGuard } from '../../auth/role.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { RequestWithUser } from '../address/shipping-address/interfaces/request-with-user.interface';
import type { ApiResponse } from '../../common/response.types';

@Controller('vouchers')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async createVoucher(
    @Body() createVoucherDto: CreateVoucherDto,
  ): Promise<ApiResponse<VoucherResponseDto>> {
    return await this.voucherService.createVoucher(createVoucherDto);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Get('all')
  async getAllVouchers(): Promise<ApiResponse<VoucherResponseDto[]>> {
    return await this.voucherService.getAllVouchers();
  }

  @UseGuards(JwtAuthGuard)
  @Get('active')
  async getActiveVouchers(): Promise<ApiResponse<VoucherResponseDto[]>> {
    return await this.voucherService.getActiveVouchers();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-vouchers')
  async getUserVouchers(
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<any[]>> {
    const userId = Number(req && req.user && req.user.userId);
    return await this.voucherService.getUserVouchers(userId);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  async getVoucherById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<VoucherResponseDto>> {
    return await this.voucherService.getVoucherById(id);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  async updateVoucher(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVoucherDto: UpdateVoucherDto,
  ): Promise<ApiResponse<VoucherResponseDto>> {
    return await this.voucherService.updateVoucher(id, updateVoucherDto);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async deleteVoucher(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<null>> {
    return await this.voucherService.deleteVoucher(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('validate')
  async validateVoucher(
    @Body() validateVoucherDto: ValidateVoucherDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = Number(req && req.user && req.user.userId);
    return await this.voucherService.validateVoucher(
      validateVoucherDto.voucherCode,
      userId,
      validateVoucherDto.orderAmount,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('apply')
  async applyVoucher(
    @Body() applyVoucherDto: ApplyVoucherToOrderDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = Number(req && req.user && req.user.userId);
    return await this.voucherService.applyVoucher(
      applyVoucherDto.voucherCode,
      userId,
      applyVoucherDto.orderId,
    );
  }
}
