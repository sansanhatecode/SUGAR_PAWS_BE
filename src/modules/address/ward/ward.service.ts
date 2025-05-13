import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { Ward } from '@prisma/client';

@Injectable()
export class WardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all wards
   * @returns Promise with list of all wards
   */
  async findAll(): Promise<Ward[]> {
    return this.prisma.ward.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get wards by district code
   * @param districtCode The district code
   * @returns Promise with list of wards in the specified district
   */
  async findByDistrictCode(districtCode: number): Promise<Ward[]> {
    return this.prisma.ward.findMany({
      where: {
        districtCode,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get a ward by its ID
   * @param wardCode The ward code
   * @returns Promise with the ward or null if not found
   */
  async findOne(wardCode: number): Promise<Ward | null> {
    return this.prisma.ward.findUnique({
      where: {
        wardCode,
      },
    });
  }
}
