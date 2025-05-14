import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { ShippingAddress } from '@prisma/client';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';
import { ApiResponse } from '../../../common/response.types';

@Injectable()
export class ShippingAddressService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all shipping addresses for a user
   * @param userId The user ID
   * @returns Array of shipping addresses
   */
  async findByUserId(userId: number): Promise<ApiResponse<ShippingAddress[]>> {
    const addresses = await this.prisma.shippingAddress.findMany({
      where: {
        userId,
      },
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
      orderBy: {
        isDefault: 'desc',
      },
    });
    return {
      statusCode: 200,
      message: 'Lấy danh sách địa chỉ thành công',
      data: addresses,
    };
  }

  /**
   * Find a shipping address by its ID
   * @param id The shipping address ID
   * @returns The shipping address or null
   */
  async findOne(id: number): Promise<ApiResponse<ShippingAddress | null>> {
    const address = await this.prisma.shippingAddress.findUnique({
      where: { id },
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
    return {
      statusCode: address ? 200 : 404,
      message: address ? 'Lấy địa chỉ thành công' : 'Không tìm thấy địa chỉ',
      data: address,
    };
  }

  /**
   * Create a new shipping address for a user
   * @param userId The user ID
   * @param data The shipping address data
   * @returns The created shipping address
   */
  async create(
    userId: number,
    data: CreateShippingAddressDto,
  ): Promise<ApiResponse<ShippingAddress>> {
    // If this is the default address, unset any existing default address
    if (data.isDefault) {
      await this.prisma.shippingAddress.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // If this is the first address for the user, make it default
    const addressCount = await this.prisma.shippingAddress.count({
      where: {
        userId,
      },
    });

    const isDefault = addressCount === 0 ? true : data.isDefault;

    const address = await this.prisma.shippingAddress.create({
      data: {
        ...data,
        isDefault,
        userId,
        moreDetail: data.moreDetail || '',
      },
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
    return {
      statusCode: 201,
      message: 'Tạo địa chỉ thành công',
      data: address,
    };
  }

  /**
   * Update a shipping address
   * @param id The shipping address ID
   * @param userId The user ID (for verification)
   * @param data The update data
   * @returns The updated shipping address
   */
  async update(
    id: number,
    userId: number,
    data: UpdateShippingAddressDto,
  ): Promise<ApiResponse<ShippingAddress>> {
    // If setting as default, unset any existing default address
    if (data.isDefault) {
      await this.prisma.shippingAddress.updateMany({
        where: {
          userId,
          isDefault: true,
          id: {
            not: id,
          },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Chỉ truyền các trường hợp hợp lệ vào data update
    const updateData: Partial<ShippingAddress> = {};
    if (typeof data.fullName !== 'undefined') {
      updateData.fullName = data.fullName;
    }
    if (typeof data.phoneNumber !== 'undefined') {
      updateData.phoneNumber = data.phoneNumber;
    }
    if (typeof data.homeNumber !== 'undefined') {
      updateData.homeNumber = data.homeNumber;
    }
    if (typeof data.wardCode !== 'undefined') {
      updateData.wardCode = data.wardCode;
    }
    if (typeof data.moreDetail !== 'undefined') {
      updateData.moreDetail = data.moreDetail;
    }
    if (typeof data.isDefault !== 'undefined') {
      updateData.isDefault = data.isDefault;
    }

    // Nếu cập nhật thành default, bỏ default cũ (trừ chính nó)
    if (updateData.isDefault) {
      await this.prisma.shippingAddress.updateMany({
        where: {
          userId,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.shippingAddress.update({
      where: { id },
      data: updateData,
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
    return {
      statusCode: 200,
      message: 'Cập nhật địa chỉ thành công',
      data: address,
    };
  }

  /**
   * Delete a shipping address
   * @param id The shipping address ID
   * @param userId The user ID (for verification)
   * @returns The deleted shipping address
   */
  async remove(
    id: number,
    userId: number,
  ): Promise<ApiResponse<ShippingAddress>> {
    const address = await this.prisma.shippingAddress.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!address) {
      return {
        statusCode: 404,
        message: 'Không tìm thấy địa chỉ',
        error: 'Not Found',
      };
    }

    // If deleting a default address and there are other addresses,
    // make another one default
    if (address?.isDefault) {
      const anotherAddress = await this.prisma.shippingAddress.findFirst({
        where: {
          userId,
          id: {
            not: id,
          },
        },
      });

      if (anotherAddress) {
        await this.prisma.shippingAddress.update({
          where: {
            id: anotherAddress.id,
          },
          data: {
            isDefault: true,
          },
        });
      }
    }

    const deleted = await this.prisma.shippingAddress.delete({
      where: { id },
    });
    return {
      statusCode: 200,
      message: 'Xóa địa chỉ thành công',
      data: deleted,
    };
  }
}
