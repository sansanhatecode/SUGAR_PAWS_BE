import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CategoryResponseDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all categories with their IDs and names
   * @returns Array of categories with id and name
   */
  async getAllCategories(): Promise<CategoryResponseDto> {
    try {
      const categories = await this.prisma.category.findMany({
        select: {
          id: true,
          name: true,
          parentId: true,
        },
        orderBy: {
          id: 'asc',
        },
      });

      return {
        success: true,
        data: categories,
        message: 'Categories retrieved successfully',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: 'Failed to retrieve categories',
        error: errorMessage,
      };
    }
  }
}
