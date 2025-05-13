import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { District } from '@prisma/client';

@Injectable()
export class DistrictService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all districts
   * @returns Promise with list of all districts
   */
  async findAll(): Promise<District[]> {
    return this.prisma.district.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get districts by city code
   * @param cityCode The city code
   * @returns Promise with list of districts in the specified city
   */
  async findByCityCode(cityCode: number): Promise<District[]> {
    return this.prisma.district.findMany({
      where: {
        cityCode,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get a district by its ID
   * @param districtCode The district code
   * @returns Promise with the district or null if not found
   */
  async findOne(districtCode: number): Promise<District | null> {
    return this.prisma.district.findUnique({
      where: {
        districtCode,
      },
    });
  }
}
