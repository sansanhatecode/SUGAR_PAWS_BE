import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { City } from '@prisma/client';

@Injectable()
export class CityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all cities
   * @returns Promise with list of all cities
   */
  async findAll(): Promise<City[]> {
    return this.prisma.city.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get a city by its ID
   * @param cityCode The city code
   * @returns Promise with the city or null if not found
   */
  async findOne(cityCode: number): Promise<City | null> {
    return this.prisma.city.findUnique({
      where: {
        cityCode,
      },
    });
  }
}
