import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { VoucherResponseDto } from './dto/voucher-response.dto';
import { VoucherValidationResult, VoucherUsageResult } from './voucher.model';
import { DiscountType } from '@prisma/client';
import type { ApiResponse } from '../../common/response.types';

@Injectable()
export class VoucherService {
  constructor(private readonly prisma: PrismaService) {}

  async createVoucher(
    createVoucherDto: CreateVoucherDto,
  ): Promise<ApiResponse<VoucherResponseDto>> {
    try {
      // Check if voucher code already exists
      const existingVoucher = await this.prisma.voucher.findUnique({
        where: { code: createVoucherDto.code },
      });

      if (existingVoucher) {
        throw new ConflictException('Voucher code already exists');
      }

      // Validate dates
      const startDate = new Date(createVoucherDto.startDate);
      const endDate = new Date(createVoucherDto.endDate);

      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }

      if (endDate <= new Date()) {
        throw new BadRequestException('End date must be in the future');
      }

      // Validate discount values
      if (
        createVoucherDto.discountType === DiscountType.PERCENTAGE &&
        (createVoucherDto.discountValue <= 0 ||
          createVoucherDto.discountValue > 100)
      ) {
        throw new BadRequestException(
          'Percentage discount must be between 1 and 100',
        );
      }

      if (
        createVoucherDto.discountType === DiscountType.FIXED_AMOUNT &&
        createVoucherDto.discountValue <= 0
      ) {
        throw new BadRequestException(
          'Fixed amount discount must be greater than 0',
        );
      }

      const voucher = await this.prisma.voucher.create({
        data: {
          ...createVoucherDto,
          startDate,
          endDate,
        },
      });

      return {
        statusCode: 201,
        message: 'Voucher created successfully',
        data: voucher as VoucherResponseDto,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to create voucher');
    }
  }

  async getAllVouchers(): Promise<ApiResponse<VoucherResponseDto[]>> {
    try {
      const vouchers = await this.prisma.voucher.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return {
        statusCode: 200,
        message: 'Vouchers retrieved successfully',
        data: vouchers as VoucherResponseDto[],
      };
    } catch {
      throw new BadRequestException('Failed to retrieve vouchers');
    }
  }

  async getActiveVouchers(): Promise<ApiResponse<VoucherResponseDto[]>> {
    try {
      const now = new Date();
      const vouchers = await this.prisma.voucher.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        statusCode: 200,
        message: 'Active vouchers retrieved successfully',
        data: vouchers as VoucherResponseDto[],
      };
    } catch {
      throw new BadRequestException('Failed to retrieve active vouchers');
    }
  }

  async getVoucherById(id: number): Promise<ApiResponse<VoucherResponseDto>> {
    try {
      const voucher = await this.prisma.voucher.findUnique({
        where: { id },
      });

      if (!voucher) {
        throw new NotFoundException('Voucher not found');
      }

      return {
        statusCode: 200,
        message: 'Voucher retrieved successfully',
        data: voucher as VoucherResponseDto,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve voucher');
    }
  }

  async updateVoucher(
    id: number,
    updateVoucherDto: UpdateVoucherDto,
  ): Promise<ApiResponse<VoucherResponseDto>> {
    try {
      const existingVoucher = await this.prisma.voucher.findUnique({
        where: { id },
      });

      if (!existingVoucher) {
        throw new NotFoundException('Voucher not found');
      }

      // Check if code is being updated and if it conflicts
      if (
        updateVoucherDto.code &&
        updateVoucherDto.code !== existingVoucher.code
      ) {
        const codeExists = await this.prisma.voucher.findUnique({
          where: { code: updateVoucherDto.code },
        });

        if (codeExists) {
          throw new ConflictException('Voucher code already exists');
        }
      }

      // Validate dates if provided
      if (updateVoucherDto.startDate || updateVoucherDto.endDate) {
        const startDate = updateVoucherDto.startDate
          ? new Date(updateVoucherDto.startDate)
          : existingVoucher.startDate;
        const endDate = updateVoucherDto.endDate
          ? new Date(updateVoucherDto.endDate)
          : existingVoucher.endDate;

        if (startDate >= endDate) {
          throw new BadRequestException('Start date must be before end date');
        }
      }

      const updateData: Record<string, any> = { ...updateVoucherDto };
      if (updateVoucherDto.startDate) {
        updateData.startDate = new Date(updateVoucherDto.startDate);
      }
      if (updateVoucherDto.endDate) {
        updateData.endDate = new Date(updateVoucherDto.endDate);
      }

      const voucher = await this.prisma.voucher.update({
        where: { id },
        data: updateData,
      });

      return {
        statusCode: 200,
        message: 'Voucher updated successfully',
        data: voucher as VoucherResponseDto,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update voucher');
    }
  }

  async deleteVoucher(id: number): Promise<ApiResponse<null>> {
    try {
      const voucher = await this.prisma.voucher.findUnique({
        where: { id },
      });

      if (!voucher) {
        throw new NotFoundException('Voucher not found');
      }

      // Check if voucher has been used
      const usageCount = await this.prisma.userVoucher.count({
        where: { voucherId: id },
      });

      if (usageCount > 0) {
        throw new BadRequestException(
          'Cannot delete voucher that has been used by users',
        );
      }

      await this.prisma.voucher.delete({
        where: { id },
      });

      return {
        statusCode: 200,
        message: 'Voucher deleted successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to delete voucher');
    }
  }

  async validateVoucher(
    voucherCode: string,
    userId: number,
    orderAmount: number,
    shippingFee?: number,
  ): Promise<VoucherValidationResult> {
    try {
      const voucher = await this.prisma.voucher.findUnique({
        where: { code: voucherCode },
      });

      if (!voucher) {
        return { isValid: false, message: 'Voucher not found' };
      }

      if (!voucher.isActive) {
        return { isValid: false, message: 'Voucher is not active' };
      }

      const now = new Date();
      if (now < voucher.startDate) {
        return { isValid: false, message: 'Voucher is not yet valid' };
      }

      if (now > voucher.endDate) {
        return { isValid: false, message: 'Voucher has expired' };
      }

      // Check usage limit
      if (
        voucher.maxUsageCount !== null &&
        voucher.currentUsageCount >= voucher.maxUsageCount
      ) {
        return { isValid: false, message: 'Voucher usage limit reached' };
      }

      // Check if user has already used this voucher
      const userUsage = await this.prisma.userVoucher.findUnique({
        where: {
          userId_voucherId: {
            userId,
            voucherId: voucher.id,
          },
        },
      });

      if (userUsage) {
        return {
          isValid: false,
          message: 'You have already used this voucher',
        };
      }

      // Check minimum order amount
      if (voucher.minOrderAmount && orderAmount < voucher.minOrderAmount) {
        return {
          isValid: false,
          message: `Minimum order amount is ${voucher.minOrderAmount}`,
        };
      }

      // Calculate discount amount
      let discountAmount = 0;
      const productAmount = orderAmount - (shippingFee || 0); // Tách tiền product ra khỏi tổng đơn

      // Kiểm tra cả voucherType và discountType
      if (voucher.type === 'DISCOUNT') {
        // Voucher giảm giá chỉ áp dụng trên tiền product, không tính phí ship
        if (voucher.discountType === DiscountType.PERCENTAGE) {
          discountAmount = (productAmount * voucher.discountValue) / 100;
          if (
            voucher.maxDiscountAmount &&
            discountAmount > voucher.maxDiscountAmount
          ) {
            discountAmount = voucher.maxDiscountAmount;
          }
        } else {
          // Đảm bảo không giảm quá tiền product
          discountAmount = Math.min(voucher.discountValue, productAmount);
        }
      } else if (voucher.type === 'SHIPPING') {
        // Voucher giảm phí vận chuyển - chỉ áp dụng lên phí ship
        const shippingAmount = shippingFee || 0;
        if (voucher.discountType === DiscountType.PERCENTAGE) {
          discountAmount = (shippingAmount * voucher.discountValue) / 100;
          if (
            voucher.maxDiscountAmount &&
            discountAmount > voucher.maxDiscountAmount
          ) {
            discountAmount = voucher.maxDiscountAmount;
          }
        } else {
          // Đảm bảo không giảm quá phí ship
          discountAmount = Math.min(voucher.discountValue, shippingAmount);
        }
      }

      return {
        isValid: true,
        message: 'Voucher is valid',
        discountAmount,
      };
    } catch {
      return { isValid: false, message: 'Error validating voucher' };
    }
  }

  async applyVoucher(
    voucherCode: string,
    userId: number,
    orderId?: number,
  ): Promise<VoucherUsageResult> {
    try {
      const voucher = await this.prisma.voucher.findUnique({
        where: { code: voucherCode },
      });

      if (!voucher) {
        return { success: false, message: 'Voucher not found' };
      }

      // Create user voucher usage record
      const voucherUsage = await this.prisma.userVoucher.create({
        data: {
          userId,
          voucherId: voucher.id,
          orderId,
        },
      });

      // Update voucher usage count
      await this.prisma.voucher.update({
        where: { id: voucher.id },
        data: {
          currentUsageCount: voucher.currentUsageCount + 1,
        },
      });

      return {
        success: true,
        message: 'Voucher applied successfully',
        voucherUsage,
      };
    } catch {
      return { success: false, message: 'Failed to apply voucher' };
    }
  }

  async getUserVouchers(): Promise<ApiResponse<VoucherResponseDto[]>> {
    try {
      const vouchers = await this.prisma.voucher.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return {
        statusCode: 200,
        message: 'All vouchers retrieved successfully',
        data: vouchers as VoucherResponseDto[],
      };
    } catch {
      throw new BadRequestException('Failed to retrieve vouchers');
    }
  }
}
